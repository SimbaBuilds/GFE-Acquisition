import { createClient } from "@supabase/supabase-js"

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log("[1/3] Inserting test SMS task scheduled for now...")
  const { data: task, error: insertError } = await supabase
    .from("scheduled_tasks")
    .insert({
      task_type: "sms",
      payload: {
        phone: "+15127690768",
        message:
          "MedClearPortal scheduled_tasks dispatcher live test — if you got this, the cron architecture works end to end.",
      },
      scheduled_for: new Date().toISOString(),
      idempotency_key: `test-sms-live-${Date.now()}`,
      notes: "Live verification of run-tasks dispatcher",
    })
    .select()
    .single()

  if (insertError) {
    console.error("Insert failed:", insertError)
    process.exit(1)
  }
  console.log("    Inserted task id:", task.id)

  console.log("[2/3] Triggering deployed cron endpoint...")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("CRON_SECRET not set in env")
    process.exit(1)
  }
  const url = "https://gfe-acquisition.vercel.app/api/cron/run-tasks"
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  })
  const status = res.status
  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = await res.text()
  }
  console.log(`    HTTP ${status}`)
  console.log("    Response:", JSON.stringify(body, null, 2))

  console.log("[3/3] Reading back task state...")
  const { data: updated, error: readError } = await supabase
    .from("scheduled_tasks")
    .select("id, status, attempts, completed_at, last_response, last_error")
    .eq("id", task.id)
    .single()
  if (readError) {
    console.error("Readback failed:", readError)
    process.exit(1)
  }
  console.log("    Final state:", JSON.stringify(updated, null, 2))

  if (updated.status === "completed") {
    console.log("\nSUCCESS — SMS dispatched.")
  } else {
    console.log("\nFAILED — task did not complete. See last_error / last_response above.")
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Unhandled:", err)
  process.exit(1)
})
