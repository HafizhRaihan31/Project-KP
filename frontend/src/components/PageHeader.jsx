export default function PageHeader({ loading, onRefresh }) {
  return <section className="page-header">
    <div>
      <p className="eyebrow"></p>
      <h1>Project Magang</h1>
      <p className="subtitle">Pilih data drop project, lalu generate laporan Word atau PDF.</p>
    </div>
    <button className="button primary" onClick={onRefresh} disabled={loading}>
      {loading ? "Refresh..." : "Refresh Sheet"}
    </button>
  </section>;
}
