"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadDetail } from "@/components/leads/lead-detail"
import { SequenceView } from "@/components/sequences/sequence-view"
import type { Lead, EmailSequence } from "@/lib/types"
import { Search, Users, Mail, BarChart3 } from "lucide-react"

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [metroFilter, setMetroFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (metroFilter !== "all") params.set("metro", metroFilter)
    if (tierFilter !== "all") params.set("tier", tierFilter)

    const res = await fetch(`/api/leads?${params}`)
    if (res.ok) {
      setLeads(await res.json())
    }
    setLoading(false)
  }, [search, statusFilter, metroFilter, tierFilter])

  const fetchSequences = useCallback(async () => {
    const res = await fetch("/api/sequences")
    if (res.ok) setSequences(await res.json())
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  // Debounced search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  function handleLeadUpdate(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setSelectedLead(updated)
  }

  // Compute stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    active: leads.filter((l) => ["contacted", "sequence_active", "replied"].includes(l.status)).length,
    booked: leads.filter((l) => l.status === "meeting_booked").length,
    won: leads.filter((l) => l.status === "closed_won").length,
  }

  const metros = [...new Set(leads.map((l) => l.metro).filter(Boolean))]
  const tiers = [...new Set(leads.map((l) => l.tier).filter(Boolean))].sort()

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg">GFE Acquisition</h1>
            <Badge variant="outline" className="text-xs">
              {stats.total} leads
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> {stats.new} new
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {stats.active} active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.booked} booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> {stats.won} won
            </span>
          </div>
        </div>
      </header>

      <Tabs defaultValue="leads" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6">
          <TabsList className="h-10">
            <TabsTrigger value="leads" className="gap-1.5">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="sequences" className="gap-1.5">
              <Mail className="h-4 w-4" />
              Sequences
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads" className="flex-1 flex overflow-hidden m-0">
          <div className={`flex-1 flex flex-col overflow-hidden ${selectedLead ? "border-r" : ""}`}>
            {/* Filters */}
            <div className="p-4 border-b flex gap-3 items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search physicians, medspas, locations..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="sequence_active">Sequence Active</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={metroFilter} onValueChange={(v) => v && setMetroFilter(v)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Metro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metros</SelectItem>
                  {metros.map((m) => (
                    <SelectItem key={m} value={m!}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={(v) => v && setTierFilter(v)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {tiers.map((t) => (
                    <SelectItem key={t} value={t!}>
                      Tier {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Loading leads...
                </div>
              ) : (
                <LeadsTable
                  leads={leads}
                  selectedId={selectedLead?.id ?? null}
                  onSelect={setSelectedLead}
                />
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selectedLead && (
            <div className="w-[480px] shrink-0 overflow-hidden border-l">
              <LeadDetail
                key={selectedLead.id}
                lead={selectedLead}
                sequences={sequences}
                onUpdate={handleLeadUpdate}
                onClose={() => setSelectedLead(null)}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="sequences" className="flex-1 overflow-auto m-0 p-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Email Sequences</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Pre-built outreach sequences. Enroll leads from the lead detail panel.
            </p>
            <SequenceView sequences={sequences} />
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 overflow-auto m-0 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Pipeline Overview</h2>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "New", count: stats.new, color: "bg-gray-100" },
                { label: "Active Outreach", count: stats.active, color: "bg-blue-100" },
                { label: "Meeting Booked", count: stats.booked, color: "bg-emerald-100" },
                { label: "Closed Won", count: stats.won, color: "bg-teal-100" },
              ].map((stage) => (
                <div key={stage.label} className={`${stage.color} rounded-lg p-4`}>
                  <div className="text-2xl font-bold">{stage.count}</div>
                  <div className="text-sm text-muted-foreground">{stage.label}</div>
                </div>
              ))}
            </div>

            {/* Metro breakdown */}
            <h3 className="font-medium mb-3">By Metro</h3>
            <div className="grid grid-cols-2 gap-3">
              {metros.map((metro) => {
                const metroLeads = leads.filter((l) => l.metro === metro)
                return (
                  <div key={metro} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{metro}</span>
                      <Badge variant="outline">{metroLeads.length}</Badge>
                    </div>
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      <span>{metroLeads.filter((l) => l.tier === "1").length} Tier 1</span>
                      <span>·</span>
                      <span>{metroLeads.filter((l) => l.tier === "2").length} Tier 2</span>
                      <span>·</span>
                      <span>{metroLeads.filter((l) => l.tier === "3").length} Tier 3</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
