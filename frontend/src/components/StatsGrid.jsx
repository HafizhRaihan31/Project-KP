import { formatRupiah } from "../utils/projects.js";

export default function StatsGrid({ totalData, visibleData, selectedData, totalBoq }) {
  const stats = [
    ["Total data", totalData],
    ["Ditampilkan", visibleData],
    ["Dipilih", selectedData],
    ["Total BOQ data aktif", formatRupiah(totalBoq), true],
  ];
  return <section className="stats-grid" aria-label="Ringkasan data">
    {stats.map(([label, value, wide]) => <div className={`stat-card${wide ? " wide" : ""}`} key={label}>
      <span>{label}</span><strong>{value}</strong>
    </div>)}
  </section>;
}
