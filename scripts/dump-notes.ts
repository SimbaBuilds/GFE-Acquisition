import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: notes, error } = await supabase
    .from("outreach_log")
    .select("lead_id, body, created_at, leads(physician, associated_medspa, email, practice_email)")
    .eq("channel", "manual_note")
    .order("created_at", { ascending: false })
  if (error) throw error
  for (const n of notes ?? []) {
    const l: any = n.leads
    console.log(`\n— ${l?.physician ?? l?.associated_medspa ?? n.lead_id}  [${n.created_at.slice(0, 16)}]`)
    console.log(`  email=${l?.email ?? "—"}  practice_email=${l?.practice_email ?? "—"}`)
    console.log(`  body: ${n.body}`)
  }
  console.log(`\nTotal: ${notes?.length ?? 0} notes`)
}

main().catch((e) => { console.error(e); process.exit(1) })
