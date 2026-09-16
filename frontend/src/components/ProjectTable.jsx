import { SORT_LABELS } from "../constants/projectTable.js";

export default function ProjectTable(props) {
  const { projects, selectedIds, sortKey, sortDir, allVisibleSelected, onSort, onToggle, onToggleAll } = props;
  return <section className="table-panel">
    <div className="table-header">
      <div><h2>Daftar Proyek</h2><p>Urutkan kolom dan centang data yang ingin dimasukkan ke laporan.</p></div>
      <span className="sort-chip">Urut: {SORT_LABELS[sortKey]} {sortDir === "asc" ? "naik" : "turun"}</span>
    </div>
    <div className="table-wrap"><table>
      <thead><tr>
        <th className="check-cell"><input type="checkbox" checked={allVisibleSelected} onChange={onToggleAll}
          aria-label="Pilih semua proyek yang ditampilkan" /></th>
        {Object.entries(SORT_LABELS).map(([key, label]) => <th key={key}>
          <button className="sort-button" onClick={() => onSort(key)}>{label}
            <span>{sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
          </button>
        </th>)}
        <th>Keterangan Drop</th>
      </tr></thead>
      <tbody>{projects.map((project) => <tr key={project.ihldLopId}
        className={selectedIds.has(project.ihldLopId) ? "selected-row" : ""}>
        <td className="check-cell"><input type="checkbox" checked={selectedIds.has(project.ihldLopId)}
          onChange={() => onToggle(project.ihldLopId)} aria-label={`Pilih proyek ${project.namaProyek}`} /></td>
        <td>{project.no}</td><td className="mono">{project.ihldLopId}</td>
        <td><span className="wok-pill">{project.wok}</span></td>
        <td className="project-name">{project.namaProyek}</td><td className="amount">{project.totalBoq}</td>
        <td className="reason">{project.keteranganDrop}</td>
      </tr>)}</tbody>
    </table></div>
    {projects.length === 0 && <div className="empty-state"><strong>Data tidak ditemukan</strong>
      <span>Coba ubah kata kunci pencarian atau filter WOK.</span></div>}
  </section>;
}
