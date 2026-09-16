import { formatRupiah } from "../utils/projects.js";

export default function ExportActionBar(props) {
  const { selectedCount, selectedBoq, filename, filenamePlaceholder, generating,
    onFilenameChange, onClear, onGenerate } = props;
  return <section className={`action-bar ${selectedCount > 0 ? "visible" : ""}`}>
    <div><strong>{selectedCount} proyek dipilih</strong>
      <span>Total BOQ terpilih: {formatRupiah(selectedBoq)}</span></div>
    <label className="export-name-field" htmlFor="export-filename">Nama file
      <input id="export-filename" value={filename} onChange={(event) => onFilenameChange(event.target.value)}
        placeholder={filenamePlaceholder} />
    </label>
    <div className="action-buttons">
      <button className="button muted" onClick={onClear} disabled={generating}>Kosongkan</button>
      <button className="button" onClick={() => onGenerate("docx")} disabled={generating}>
        {generating ? "Memproses..." : "Download Word"}</button>
      <button className="button primary" onClick={() => onGenerate("pdf")} disabled={generating}>
        {generating ? "Memproses..." : "Download PDF"}</button>
    </div>
  </section>;
}
