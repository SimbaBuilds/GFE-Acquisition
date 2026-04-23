"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusBadge } from "./status-badge"
import type { Lead, LeadStatus, EmailSequence, OutreachLogEntry } from "@/lib/types"
import {
  ExternalLink,
  Mail,
  Phone,
  Link,
  Send,
  PlayCircle,
  MessageSquare,
  Clock,
  X,
} from "lucide-react"
import { toast } from "sonner"

interface LeadDetailProps {
  lead: Lead
  sequences: EmailSequence[]
  onUpdate: (lead: Lead) => void
  onClose: () => void
}

export function LeadDetail({ lead, sequences, onUpdate, onClose }: LeadDetailProps) {
  const [outreachLog, setOutreachLog] = useState<OutreachLogEntry[]>([])
  const [email, setEmail] = useState(lead.email ?? "")
  const [linkedinUrl, setLinkedinUrl] = useState(lead.linkedin_url ?? "")
  const [sendSubject, setSendSubject] = useState("")
  const [sendBody, setSendBody] = useState("")
  const [noteBody, setNoteBody] = useState("")
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  const fetchLog = useCallback(async () => {
    const res = await fetch(`/api/outreach?lead_id=${lead.id}`)
    if (res.ok) setOutreachLog(await res.json())
  }, [lead.id])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  async function updateLead(updates: Partial<Lead>) {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, ...updates }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
      toast.success("Lead updated")
    }
  }

  async function saveContactInfo() {
    await updateLead({ email: email || null, linkedin_url: linkedinUrl || null } as Partial<Lead>)
  }

  async function enrollInSequence(sequenceId: string) {
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enroll_sequence", lead_id: lead.id, sequence_id: sequenceId }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(`Enrolled — ${data.scheduled} emails scheduled`)
      fetchLog()
      // Refresh lead data
      const leadRes = await fetch(`/api/leads?search=${encodeURIComponent(lead.physician ?? "")}`)
      if (leadRes.ok) {
        const leads = await leadRes.json()
        const updated = leads.find((l: Lead) => l.id === lead.id)
        if (updated) onUpdate(updated)
      }
    } else {
      toast.error("Failed to enroll")
    }
  }

  async function sendEmail() {
    if (!email) {
      toast.error("Add an email address first")
      return
    }
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_email",
        lead_id: lead.id,
        subject: sendSubject,
        body: sendBody,
        to_email: email,
      }),
    })
    if (res.ok) {
      toast.success("Email logged (Resend integration pending)")
      setSendDialogOpen(false)
      setSendSubject("")
      setSendBody("")
      fetchLog()
    }
  }

  async function logNote() {
    if (!noteBody.trim()) return
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log_note", lead_id: lead.id, body: noteBody }),
    })
    if (res.ok) {
      toast.success("Note logged")
      setNoteBody("")
      fetchLog()
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold text-lg">{lead.physician || lead.associated_medspa || "Unknown"}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={lead.status} />
            {lead.metro && <Badge variant="outline">{lead.metro}</Badge>}
            {lead.tier && <Badge variant="outline">Tier {lead.tier}</Badge>}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Contact Info */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Add email..."
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">LinkedIn</Label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="Add LinkedIn URL..."
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {lead.website}
                </a>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={saveContactInfo}>
              Save Contact Info
            </Button>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lead.credentials && (
              <div>
                <span className="text-muted-foreground">Credentials:</span>{" "}
                {lead.credentials}
              </div>
            )}
            {lead.own_practice && (
              <div>
                <span className="text-muted-foreground">Own Practice:</span>{" "}
                {lead.own_practice}
              </div>
            )}
            {lead.associated_medspa && (
              <div>
                <span className="text-muted-foreground">Medspa:</span>{" "}
                {lead.associated_medspa}
              </div>
            )}
            {lead.medspa_owner_operator && (
              <div>
                <span className="text-muted-foreground">Owner/Operator:</span>{" "}
                {lead.medspa_owner_operator}
              </div>
            )}
            {lead.medspa_location && (
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                {lead.medspa_location}
              </div>
            )}
            {lead.notes && (
              <div>
                <span className="text-muted-foreground">Notes:</span>{" "}
                {lead.notes}
              </div>
            )}
            {lead.source_url && (
              <div>
                <span className="text-muted-foreground">Source:</span>{" "}
                <a
                  href={lead.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Link
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={lead.status}
              onValueChange={(val) => updateLead({ status: val as LeadStatus })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="sequence_active">Sequence Active</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <DialogTrigger>
                  <Button size="sm" variant="outline">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Send Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Email to {lead.physician || "Lead"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>To</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input value={sendSubject} onChange={(e) => setSendSubject(e.target.value)} />
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Textarea value={sendBody} onChange={(e) => setSendBody(e.target.value)} rows={8} />
                    </div>
                    <Button onClick={sendEmail}>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {lead.linkedin_url && (
                <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <Link className="h-3.5 w-3.5 mr-1.5" />
                    LinkedIn
                  </Button>
                </a>
              )}

              {lead.phone && (
                <a href={`tel:${lead.phone}`}>
                  <Button size="sm" variant="outline">
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    Call
                  </Button>
                </a>
              )}
            </div>

            <Separator />

            {/* Enroll in sequence */}
            <div>
              <Label className="text-xs mb-1.5 block">Enroll in Email Sequence</Label>
              <div className="flex gap-2">
                {sequences.map((seq) => (
                  <Button
                    key={seq.id}
                    size="sm"
                    variant={lead.current_sequence_id === seq.id ? "secondary" : "outline"}
                    onClick={() => enrollInSequence(seq.id)}
                    disabled={lead.current_sequence_id === seq.id}
                  >
                    <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                    {seq.name}
                    {lead.current_sequence_id === seq.id && " (Active)"}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Log a note */}
            <div>
              <Label className="text-xs mb-1.5 block">Log a Note</Label>
              <div className="flex gap-2">
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="LinkedIn DM sent, left voicemail, etc..."
                  rows={2}
                  className="text-sm"
                />
                <Button size="sm" onClick={logNote} className="shrink-0">
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outreach History */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Outreach History</CardTitle>
          </CardHeader>
          <CardContent>
            {outreachLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outreach yet</p>
            ) : (
              <div className="space-y-3">
                {outreachLog.map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <div className="shrink-0 mt-0.5">
                      {entry.channel === "email" && <Mail className="h-4 w-4 text-blue-500" />}
                      {entry.channel === "linkedin" && <Link className="h-4 w-4 text-blue-700" />}
                      {entry.channel === "phone" && <Phone className="h-4 w-4 text-green-600" />}
                      {entry.channel === "manual_note" && <MessageSquare className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {entry.status}
                        </Badge>
                        {entry.step_number && (
                          <span className="text-xs text-muted-foreground">Step {entry.step_number}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.status === "scheduled" && entry.scheduled_for
                            ? new Date(entry.scheduled_for).toLocaleDateString()
                            : entry.sent_at
                              ? new Date(entry.sent_at).toLocaleDateString()
                              : ""}
                        </span>
                      </div>
                      {entry.subject && (
                        <div className="font-medium mt-0.5 truncate">{entry.subject}</div>
                      )}
                      {entry.body && (
                        <div className="text-muted-foreground mt-0.5 line-clamp-2">{entry.body}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
