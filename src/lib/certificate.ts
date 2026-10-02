// Gemological certificate helpers, shared by the admin form and the storefront.

export const LABS = ["GIA", "IGI", "HRD", "None"] as const;
export type Lab = (typeof LABS)[number];

/** "GIA 2458901234" or "2458901234" -> "2458901234" */
export function compactNumber(_lab: string, raw: string): string {
  return raw.replace(/^\s*(GIA|IGI|HRD)\b\s*/i, "").replace(/[^A-Za-z0-9]/g, "");
}

/**
 * Verification page for a report. GIA and IGI publish a lookup page; the number is passed along as a query
 * parameter so the lookup can pre-fill. HRD has no link we can build, so it returns null.
 */
export function verifyUrl(lab: string | null | undefined, number: string | null | undefined): string | null {
  if (!lab || !number) return null;
  const n = compactNumber(lab, number);
  if (!n) return null;
  if (lab === "GIA") return `https://www.gia.edu/report-check?reportno=${encodeURIComponent(n)}`;
  if (lab === "IGI") return `https://www.igi.org/reports/verify-your-report?r=${encodeURIComponent(n)}`;
  return null;
}
