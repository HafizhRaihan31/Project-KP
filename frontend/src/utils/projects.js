export function parseAmount(value) {
  return Number(String(value || "0").replace(/[^\d]/g, "")) || 0;
}

export function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(value);
}

export function sortProjects(items, sortKey, sortDir) {
  const multiplier = sortDir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const numeric = sortKey === "totalBoq" || sortKey === "no";
    const left = numeric ? parseAmount(a[sortKey]) : String(a[sortKey] || "");
    const right = numeric ? parseAmount(b[sortKey]) : String(b[sortKey] || "");
    if (typeof left === "number" && typeof right === "number") return (left - right) * multiplier;
    return left.localeCompare(right, "id", { numeric: true, sensitivity: "base" }) * multiplier;
  });
}
