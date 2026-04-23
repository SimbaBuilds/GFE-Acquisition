import { Badge } from "@/components/ui/badge"
import type { LeadStatus } from "@/lib/types"

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  contacted: { label: "Contacted", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  sequence_active: { label: "Sequence Active", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  replied: { label: "Replied", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  meeting_booked: { label: "Meeting Booked", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  closed_won: { label: "Closed Won", className: "bg-teal-100 text-teal-700 hover:bg-teal-100" },
  closed_lost: { label: "Closed Lost", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  unsubscribed: { label: "Unsubscribed", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
  return <Badge className={config.className}>{config.label}</Badge>
}
