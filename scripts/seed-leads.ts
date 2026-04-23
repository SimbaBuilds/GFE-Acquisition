/**
 * Parse prospect CSVs and upload to Supabase leads table.
 * Run with: npx tsx scripts/seed-leads.ts
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Metro section headers that appear in the Tier column
const METRO_HEADERS: Record<string, string> = {
  "ATLANTA - TOP TARGETS": "Atlanta",
  "ATLANTA - CONFIRMED TYPE 5": "Atlanta",
  "ATLANTA - NP/PA MEDSPAS (MD NOT IDENTIFIED)": "Atlanta",
  "MIAMI / SOUTH FLORIDA - TOP TARGETS": "Miami",
  "MIAMI - CONFIRMED TYPE 5": "Miami",
  "MIAMI - NP/PA MEDSPAS (MD NOT IDENTIFIED)": "Miami",
  "PHOENIX / SCOTTSDALE - TOP TARGETS": "Phoenix",
  "PHOENIX - CONFIRMED TYPE 5": "Phoenix",
  "PHOENIX - MD DIRECTOR SERVICES IN AZ": "Phoenix",
  "HOUSTON - TOP TARGETS": "Houston",
  "HOUSTON - CONFIRMED TYPE 5": "Houston",
  "SAN ANTONIO - TOP TARGETS": "San Antonio",
  "SAN ANTONIO - CONFIRMED TYPE 5": "San Antonio",
  "SA - NP/RN MEDSPAS (MD NOT YET IDENTIFIED)": "San Antonio",
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(filePath: string): Record<string, string>[] {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n").filter((l) => l.trim())
  if (lines.length === 0) return []

  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  let currentMetro = ""

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    const tierVal = fields[0] || ""

    // Check if this is a metro section header
    if (METRO_HEADERS[tierVal]) {
      currentMetro = METRO_HEADERS[tierVal]
      continue
    }

    // Skip empty rows
    if (fields.every((f) => !f)) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = fields[idx] || ""
    })
    row["_metro"] = currentMetro
    rows.push(row)
  }

  return rows
}

async function main() {
  const docsDir = resolve(__dirname, "../../client_acquisition_docs")

  const allMetros = parseCSV(resolve(docsDir, "prospect_list_all_metros.csv"))
  const houstonSA = parseCSV(resolve(docsDir, "prospect_list_houston_sa.csv"))

  console.log(`Parsed ${allMetros.length} rows from all_metros, ${houstonSA.length} rows from houston_sa`)

  const allRows = [...allMetros, ...houstonSA]

  const leads = allRows.map((row) => ({
    tier: row["Tier"] || null,
    metro: row["_metro"] || null,
    physician: row["Physician"] || null,
    credentials: row["Credentials"] || null,
    own_practice: row["Own Practice"] || null,
    associated_medspa: row["Associated Medspa"] || null,
    medspa_owner_operator: row["Medspa Owner/Operator"] || null,
    medspa_location: row["Medspa Location"] || null,
    phone: row["Phone"] || null,
    website: row["Website"] || null,
    source_url: row["Source URL"] || null,
    notes: row["Notes"] || null,
    status: "new",
  }))

  // Filter out rows that have no meaningful data
  const validLeads = leads.filter(
    (l) => l.physician || l.associated_medspa
  )

  console.log(`Inserting ${validLeads.length} valid leads...`)

  // Insert in batches of 50
  for (let i = 0; i < validLeads.length; i += 50) {
    const batch = validLeads.slice(i, i + 50)
    const { error } = await supabase.from("leads").insert(batch)
    if (error) {
      console.error(`Error inserting batch at ${i}:`, error)
      process.exit(1)
    }
    console.log(`  Inserted ${Math.min(i + 50, validLeads.length)}/${validLeads.length}`)
  }

  console.log("Done!")
}

main()
