import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

async function main() {
  const { data: notes, error } = await supabase
    .from("outreach_log")
    .select("lead_id, body, created_at")
    .eq("channel", "manual_note")
    .order("created_at", { ascending: false })

  if (error) throw error
  console.log(`Scanning ${notes?.length ?? 0} manual_note entries…`)

  // Most recent email per lead (notes already DESC-sorted)
  const picked = new Map<string, { email: string; from: string }>()
  for (const n of notes ?? []) {
    if (!n.body || picked.has(n.lead_id)) continue
    const matches = n.body.match(EMAIL_RE)
    if (matches && matches.length > 0) {
      picked.set(n.lead_id, { email: matches[0], from: n.created_at })
    }
  }

  console.log(`Found emails in notes for ${picked.size} leads.`)

  // Fetch current leads to compare/skip identical
  const leadIds = Array.from(picked.keys())
  const { data: leads } = await supabase
    .from("leads")
    .select("id, physician, practice_email")
    .in("id", leadIds)

  const current = new Map((leads ?? []).map((l) => [l.id, l]))

  let updated = 0
  let skipped = 0
  for (const [leadId, { email, from }] of picked) {
    const existing = current.get(leadId)?.practice_email
    if (existing === email) {
      skipped++
      continue
    }
    if (!process.env.APPLY) {
      // dry-run
    } else {
      const { error: upErr } = await supabase
        .from("leads")
        .update({ practice_email: email })
        .eq("id", leadId)
      if (upErr) {
        console.error(`  FAIL ${current.get(leadId)?.physician ?? leadId}: ${upErr.message}`)
        continue
      }
    }
    console.log(
      `  ${current.get(leadId)?.physician ?? leadId} -> ${email}` +
        (existing ? ` (was: ${existing})` : "") +
        ` [from note ${from.slice(0, 10)}]`
    )
    updated++
  }
  console.log(`\n${process.env.APPLY ? "APPLIED" : "DRY-RUN"} — would update: ${updated}, unchanged: ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
