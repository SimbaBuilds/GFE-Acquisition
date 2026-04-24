"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Mail,
  CheckCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  Link,
  Send,
  RefreshCw,
} from "lucide-react"

interface ActivityLead {
  id: string
  physician: string | null
  associated_medspa: string | null
  metro: string | null
}

interface ActivityEntry {
  id: string
  lead_id: string
  lead: ActivityLead | null
  channel: string
  subject: string | null
  body: string | null
  status: string
  step_number: number | null
  sent_at: string | null
  scheduled_for: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  sent: { icon: Send, label: "Sent", color: "text-blue-600", bg: "bg-blue-50" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "text-green-600", bg: "bg-green-50" },
  opened: { icon: Eye, label: "Opened", color: "text-purple-600", bg: "bg-purple-50" },
  clicked: { icon: MousePointerClick, label: "Clicked", color: "text-indigo-600", bg: "bg-indigo-50" },
  replied: { icon: MessageSquare, label: "Replied", color: "text-emerald-600", bg: "bg-emerald-50" },
  bounced: { icon: AlertTriangle, label: "Bounced", color: "text-red-600", bg: "bg-red-50" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-600", bg: "bg-red-50" },
  scheduled: { icon: Clock, label: "Scheduled", color: "text-amber-600", bg: "bg-amber-50" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "text-gray-500", bg: "bg-gray-50" },
}

const CHANNEL_ICON: Record<string, React.ElementType> = {
  email: Mail,
  linkedin: Link,
  phone: Phone,
  manual_note: MessageSquare,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "webhook">("all")

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: "100" })
    if (filter === "webhook") {
      params.set("status", "delivered,opened,clicked,bounced")
    }
    const res = await fetch(`/api/activity?${params}`)
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const leadName = (lead: ActivityLead | null) => {
    if (!lead) return "Unknown lead"
    return lead.physician || lead.associated_medspa || "Unknown"
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Activity Feed</h2>
          <p className="text-sm text-muted-foreground">
            Recent outreach events including webhook delivery tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "all" ? "bg-foreground text-background" : "bg-white text-muted-foreground hover:text-foreground"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter("webhook")}
              className={`px-3 py-1.5 text-xs font-medium border-l transition-colors ${
                filter === "webhook" ? "bg-foreground text-background" : "bg-white text-muted-foreground hover:text-foreground"
              }`}
            >
              Webhook Only
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={fetchActivity} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading activity...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "webhook" ? "No webhook events yet. Events appear here when Resend delivers, opens, clicks, or bounces emails." : "No outreach activity yet."}
          </p>
        </div>
      ) : (
        <div className="border rounded-xl bg-white overflow-hidden">
          {entries.map((entry, idx) => {
            const config = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.sent
            const StatusIcon = config.icon
            const ChannelIcon = CHANNEL_ICON[entry.channel] ?? Mail
            const timestamp = entry.sent_at || entry.scheduled_for || entry.created_at

            return (
              <div
                key={entry.id}
                className={`flex items-start gap-3 px-4 py-3 ${idx < entries.length - 1 ? "border-b" : ""} hover:bg-muted/30 transition-colors`}
              >
                {/* Status icon */}
                <div className={`mt-0.5 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                  <StatusIcon className={`h-4 w-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">
                      {leadName(entry.lead)}
                    </span>
                    {entry.lead?.metro && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                        {entry.lead.metro}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChannelIcon className="h-3 w-3" />
                    <Badge className={`${config.bg} ${config.color} border-0 text-[10px] px-1.5 py-0 font-medium`}>
                      {config.label}
                    </Badge>
                    {entry.step_number && (
                      <span>Step {entry.step_number}</span>
                    )}
                    {entry.subject && (
                      <span className="truncate max-w-[250px]">&ldquo;{entry.subject}&rdquo;</span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground shrink-0 mt-1">
                  {timeAgo(timestamp)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
