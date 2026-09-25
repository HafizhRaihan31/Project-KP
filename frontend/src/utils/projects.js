export function parseAmount(value) {
  return Number(String(value || "0").replace(/[^\d]/g, "")) || 0;
}

export function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(value);
}

export function parseInputDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? NaN : value.getTime();

  if (typeof value === "number" && Number.isFinite(value)) {
    // Google Sheets dapat mengembalikan tanggal sebagai serial hari spreadsheet.
    return Date.UTC(1899, 11, 30) + (value * 24 * 60 * 60 * 1000);
  }

  const text = String(value || "").trim();
  if (!text) return NaN;

  let match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]));

  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? NaN : parsed;
}

export function formatInputDate(value) {
  const timestamp = parseInputDate(value);
  if (Number.isNaN(timestamp)) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

export function sortProjects(items, sortKey, sortDir) {
  const multiplier = sortDir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sortKey === "tanggalInput") {
      const left = parseInputDate(a[sortKey]);
      const right = parseInputDate(b[sortKey]);
      if (Number.isNaN(left) && Number.isNaN(right)) return 0;
      if (Number.isNaN(left)) return 1;
      if (Number.isNaN(right)) return -1;
      return (left - right) * multiplier;
    }
    const numeric = ["totalBoq", "no", "jmlOdp", "jmlPort"].includes(sortKey);
    const left = numeric ? parseAmount(a[sortKey]) : String(a[sortKey] || "");
    const right = numeric ? parseAmount(b[sortKey]) : String(b[sortKey] || "");
    if (typeof left === "number" && typeof right === "number") return (left - right) * multiplier;
    return left.localeCompare(right, "id", { numeric: true, sensitivity: "base" }) * multiplier;
  });
}
