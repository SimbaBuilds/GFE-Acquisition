"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import type { Lead } from "@/lib/types"
import { ExternalLink } from "lucide-react"

interface LeadsTableProps {
  leads: Lead[]
  selectedId: string | null
  onSelect: (lead: Lead) => void
}

export function LeadsTable({ leads, selectedId, onSelect }: LeadsTableProps) {
  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Tier</TableHead>
            <TableHead className="w-[100px]">Metro</TableHead>
            <TableHead>Physician</TableHead>
            <TableHead>Medspa</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Phone</TableHead>
            <TableHead className="w-[50px]">Web</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No leads found
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className={`cursor-pointer transition-colors ${selectedId === lead.id ? "bg-accent" : "hover:bg-muted/50"}`}
              onClick={() => onSelect(lead)}
            >
              <TableCell className="font-mono text-xs">{lead.tier}</TableCell>
              <TableCell className="text-sm">{lead.metro}</TableCell>
              <TableCell>
                <div className="font-medium text-sm">{lead.physician || "—"}</div>
                {lead.credentials && (
                  <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {lead.credentials}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">{lead.associated_medspa || "—"}</div>
                {lead.medspa_owner_operator && (
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {lead.medspa_owner_operator}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={lead.status} />
              </TableCell>
              <TableCell className="text-xs">{lead.phone || "—"}</TableCell>
              <TableCell>
                {lead.website && (
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
