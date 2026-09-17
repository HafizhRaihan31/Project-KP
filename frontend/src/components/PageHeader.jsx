export default function PageHeader({ loading, onRefresh, onLogout }) {
  return <section className="page-header">
    <div className="brand-lockup">
      <div className="brand-symbol" aria-hidden="true"><span>D</span></div>
      <div>
        <p className="eyebrow">Project Document System</p>
        <h1>Doc Generator</h1>
        <p className="subtitle">Pilih data proyek, lalu buat dokumen dalam format Word atau PDF.</p>
      </div>
    </div>
    <div className="header-actions">
      <button className="button muted" onClick={onLogout}>Keluar</button>
      <button className="button primary" onClick={onRefresh} disabled={loading}>
        {loading ? "Memperbarui..." : "Perbarui data"}
      </button>
    </div>
  </section>;
}
