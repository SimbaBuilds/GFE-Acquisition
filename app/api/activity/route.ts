import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50")
  const statusFilter = req.nextUrl.searchParams.get("status") // e.g. "delivered,opened,clicked,bounced"

  let query = supabase
    .from("outreach_log")
    .select("*, lead:leads(id, physician, associated_medspa, metro)")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (statusFilter) {
    const statuses = statusFilter.split(",")
    query = query.in("status", statuses)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
