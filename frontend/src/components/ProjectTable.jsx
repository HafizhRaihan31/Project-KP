import { SORT_LABELS } from "../constants/projectTable.js";
import { formatInputDate } from "../utils/projects.js";

export default function ProjectTable(props) {
  const { projects, selectedIds, sortKey, sortDir, allVisibleSelected,
    onSort, onToggle, onToggleAll, dateFilter } = props;
  return <section className="table-panel">
    <div className="table-header">
      <div><h2>Daftar Proyek</h2><p>Urutkan kolom dan centang data yang ingin dimasukkan ke laporan.</p></div>
      <span className="sort-chip">Urut: {SORT_LABELS[sortKey]} {sortDir === "asc" ? "naik" : "turun"}</span>
    </div>
    <div className="mobile-selection-bar">
      <label>
        <input type="checkbox" checked={allVisibleSelected} onChange={onToggleAll}
          aria-label="Pilih semua proyek yang ditampilkan" />
        <span>{allVisibleSelected ? "Batalkan semua" : "Pilih semua hasil"}</span>
      </label>
      <strong>{selectedIds.size} dipilih</strong>
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
      </tr></thead>
      <tbody>{projects.map((project) => <tr key={project.ihldLopId}
        className={selectedIds.has(project.ihldLopId) ? "selected-row" : ""}>
        <td className="check-cell"><label className="row-check-label">
          <input type="checkbox" checked={selectedIds.has(project.ihldLopId)}
            onChange={() => onToggle(project.ihldLopId)} aria-label={`Pilih proyek ${project.namaProyek}`} />
        </label></td>
        <td className="input-date" data-label="Tanggal input">{formatInputDate(project.tanggalInput)}</td>
        <td data-label="No.">{project.no}</td>
        <td data-label="WOK"><span className="wok-pill">{project.wok}</span></td>
        <td data-label="Tipe Desain">{project.tipeDesain}</td>
        <td className="project-name" data-label="Nama proyek">{project.namaProyek}</td>
        <td className="reason" data-label="Keterangan drop">{project.keteranganDrop}</td>
        <td className="mono" data-label="IHLD Lop ID">{project.ihldLopId}</td>
        <td data-label="Jml ODP">{project.jmlOdp}</td>
        <td data-label="Jml Port">{project.jmlPort}</td>
        <td className="amount" data-label="Total BOQ">{project.totalBoq}</td>
      </tr>)}</tbody>
    </table></div>
    {projects.length === 0 && <div className="empty-state">
      <strong>{dateFilter
        ? `Tidak ada data pada tanggal ${formatInputDate(dateFilter)}`
        : "Data tidak ditemukan"}</strong>
      <span>{dateFilter
        ? "Tidak ada data proyek masuk tanggal tersebut."
        : "Coba ubah kata kunci pencarian atau filter WOK."}</span>
    </div>}
  </section>;
}
