import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const UPDATES: { match: string; practice_email: string }[] = [
  { match: "Edwin Parrilla", practice_email: "hello@askalluramd.co" },
  { match: "Crystal Broussard", practice_email: "aminnear@genesisdoctors.com" },
  { match: "Aaron J. Hupman", practice_email: "dbbybostic@aboutfaceskin.com" },
]

async function main() {
  for (const u of UPDATES) {
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, physician, practice_email")
      .ilike("physician", `%${u.match}%`)
    if (error) throw error
    if (!leads || leads.length !== 1) {
      console.error(`  AMBIGUOUS for "${u.match}": ${leads?.length ?? 0} matches`)
      continue
    }
    const lead = leads[0]
    const { error: upErr } = await supabase
      .from("leads")
      .update({ practice_email: u.practice_email })
      .eq("id", lead.id)
    if (upErr) {
      console.error(`  FAIL ${lead.physician}: ${upErr.message}`)
      continue
    }
    console.log(`  ${lead.physician} -> ${u.practice_email} (was: ${lead.practice_email ?? "—"})`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
