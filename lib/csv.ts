/**
 * Formats a value as a safe CSV cell: guards against formula injection
 * (a worker ID like "=HYPERLINK(...)" becoming a live formula when the
 * file is opened in Excel/Sheets) and quotes values that contain a comma,
 * quote, or newline.
 */
export function csvCell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
