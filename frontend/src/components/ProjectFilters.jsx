export default function ProjectFilters(props) {
  const { search, wokFilter, dateFilter, wokOptions, loading,
    onSearchChange, onWokChange, onDateChange, onReset } = props;
  return <section className="toolbar" aria-label="Filter dan pencarian">
    <div className="search-box">
      <label htmlFor="project-search">Cari data</label>
      <input id="project-search" type="text" placeholder="Nama proyek, ID, WOK, atau keterangan..."
        value={search} onChange={(event) => onSearchChange(event.target.value)} />
    </div>
    <div className="select-box">
      <label htmlFor="wok-filter">WOK</label>
      <select id="wok-filter" value={wokFilter} onChange={(event) => onWokChange(event.target.value)}>
        <option value="all">Semua WOK</option>
        {wokOptions.map((wok) => <option key={wok} value={wok}>{wok}</option>)}
      </select>
    </div>
    <div className="date-box">
      <label htmlFor="date-filter">Tanggal input</label>
      <input id="date-filter" type="date" value={dateFilter}
        onInput={(event) => onDateChange(event.currentTarget.value)} />
    </div>
    <div className="toolbar-actions">
      <button className="button muted" onClick={onReset} disabled={loading}>Reset</button>
    </div>
  </section>;
}
