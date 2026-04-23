import { createServiceClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createServiceClient()

  const { data: sequences, error } = await supabase
    .from("email_sequences")
    .select("*, steps:sequence_steps(*)")
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort steps within each sequence
  for (const seq of sequences ?? []) {
    if (seq.steps) {
      seq.steps.sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
    }
  }

  return NextResponse.json(sequences)
}

// Update a sequence step
export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  // Update sequence metadata
  if (body.type === "sequence") {
    const { id, name, description, is_active } = body
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabase
      .from("email_sequences")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Update a single step
  if (body.type === "step") {
    const { id, delay_days, subject_template, body_template, channel } = body
    const updates: Record<string, unknown> = {}
    if (delay_days !== undefined) updates.delay_days = delay_days
    if (subject_template !== undefined) updates.subject_template = subject_template
    if (body_template !== undefined) updates.body_template = body_template
    if (channel !== undefined) updates.channel = channel

    const { data, error } = await supabase
      .from("sequence_steps")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: "type must be 'sequence' or 'step'" }, { status: 400 })
}
