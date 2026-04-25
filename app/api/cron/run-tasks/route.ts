import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type SmsPayload = { phone: string; message: string }
type TextBeltResponse = {
  success?: boolean
  textId?: string
  quotaRemaining?: number
  error?: string
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { data: tasks, error: fetchError } = await supabase
    .from("scheduled_tasks")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(20)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ processed: 0, message: "No tasks due" })
  }

  const results: { id: string; task_type: string; status: string; error?: string }[] = []

  for (const task of tasks) {
    try {
      let response: TextBeltResponse
      if (task.task_type === "sms") {
        response = await dispatchSms(task.payload as SmsPayload)
      } else {
        throw new Error(`Unknown task_type: ${task.task_type}`)
      }

      const success = response.success === true
      await supabase
        .from("scheduled_tasks")
        .update({
          status: success ? "completed" : "failed",
          attempts: task.attempts + 1,
          last_response: response,
          last_error: success ? null : response.error ?? "Provider returned success=false",
          completed_at: success ? new Date().toISOString() : null,
        })
        .eq("id", task.id)

      results.push({
        id: task.id,
        task_type: task.task_type,
        status: success ? "completed" : "failed",
        error: success ? undefined : response.error,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      await supabase
        .from("scheduled_tasks")
        .update({
          status: "failed",
          attempts: task.attempts + 1,
          last_error: msg,
        })
        .eq("id", task.id)
      results.push({ id: task.id, task_type: task.task_type, status: "failed", error: msg })
    }
  }

  const completed = results.filter((r) => r.status === "completed").length
  const failed = results.filter((r) => r.status === "failed").length
  return NextResponse.json({ processed: results.length, completed, failed, results })
}

async function dispatchSms(payload: SmsPayload): Promise<TextBeltResponse> {
  const apiKey = process.env.TEXTBELT_API_KEY
  if (!apiKey) throw new Error("TEXTBELT_API_KEY not configured")
  const params = new URLSearchParams({
    phone: payload.phone,
    message: payload.message,
    key: apiKey,
  })
  const res = await fetch("https://textbelt.com/text", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })
  return (await res.json()) as TextBeltResponse
}
