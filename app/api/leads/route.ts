import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const url = req.nextUrl.searchParams

  let query = supabase.from("leads").select("*")

  const status = url.get("status")
  if (status && status !== "all") query = query.eq("status", status)

  const metro = url.get("metro")
  if (metro && metro !== "all") query = query.eq("metro", metro)

  const tier = url.get("tier")
  if (tier && tier !== "all") query = query.eq("tier", tier)

  const search = url.get("search")
  if (search) {
    query = query.or(
      `physician.ilike.%${search}%,associated_medspa.ilike.%${search}%,notes.ilike.%${search}%,medspa_location.ilike.%${search}%`
    )
  }

  query = query.order("tier", { ascending: true }).order("physician", { ascending: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const leadIds = (data ?? []).map((l) => l.id)
  let latestNoteByLead = new Map<string, { body: string | null; created_at: string }>()
  if (leadIds.length > 0) {
    const { data: notes } = await supabase
      .from("outreach_log")
      .select("lead_id, body, created_at")
      .eq("channel", "manual_note")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false })
    for (const n of notes ?? []) {
      if (!latestNoteByLead.has(n.lead_id)) {
        latestNoteByLead.set(n.lead_id, { body: n.body, created_at: n.created_at })
      }
    }
  }

  const enriched = (data ?? []).map((l) => {
    const latest = latestNoteByLead.get(l.id)
    return {
      ...l,
      latest_note: latest?.body ?? null,
      latest_note_at: latest?.created_at ?? null,
    }
  })

  return NextResponse.json(enriched)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
