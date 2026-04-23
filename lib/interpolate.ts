import type { Lead } from "./types"

/**
 * Replace {{variable}} placeholders in a template string with lead data.
 * Supported variables:
 *   {{physician}}          – lead.physician (last name stripped of "Dr." prefix)
 *   {{physician_full}}     – lead.physician as-is
 *   {{medspa}}             – lead.associated_medspa
 *   {{metro}}              – lead.metro
 *   {{location}}           – lead.medspa_location
 *   {{owner}}              – lead.medspa_owner_operator
 *   {{credentials}}        – lead.credentials
 *   {{practice}}           – lead.own_practice
 *   {{medspa_count}}       – rough count of locations (commas + "+" in medspa_location)
 */
export function interpolate(template: string, lead: Lead): string {
  const physician = lead.physician ?? ""
  // Strip "Dr. " prefix for the short form but keep last name
  const physicianShort = physician.replace(/^Dr\.\s*/i, "").split(",")[0].trim()

  // Estimate location count from the location string
  const locationStr = lead.medspa_location ?? ""
  const locationCount = locationStr
    ? locationStr.split(",").length.toString()
    : "multiple"

  const vars: Record<string, string> = {
    physician: physicianShort || "there",
    physician_full: physician || "Physician",
    medspa: lead.associated_medspa ?? "your medspas",
    metro: lead.metro ?? "your area",
    location: locationStr || "your locations",
    owner: lead.medspa_owner_operator ?? "",
    credentials: lead.credentials ?? "",
    practice: lead.own_practice ?? "",
    medspa_count: locationCount,
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] ?? match
  })
}
