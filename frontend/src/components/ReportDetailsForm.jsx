const fields = [
  { key: "projectTitle", label: "Judul proyek laporan", placeholder: "Contoh: JPP 2026 TIF Batch 1 Semarang" },
  { key: "contractNumber", label: "No. Kontrak", placeholder: "Opsional" },
  { key: "spNumber", label: "No. SP", placeholder: "Opsional" },
  { key: "executor", label: "Pelaksana", placeholder: "PT. TELKOM AKSES" },
  { key: "district", label: "District / lokasi", placeholder: "Contoh: Semarang" },
];

export default function ReportDetailsForm({ values, onChange }) {
  function update(key, value) {
    onChange({ ...values, [key]: value });
  }

  return <section className="report-details" aria-labelledby="report-details-title">
    <div className="report-details-header">
      <div>
        <h2 id="report-details-title">Detail Berita Acara</h2>
        <p>Nilai ini akan dicetak tebal pada header dan paragraf pembuka dokumen.</p>
      </div>
      <span>Isi sebelum download</span>
    </div>
    <div className="report-details-grid">
      {fields.map((field) => <label key={field.key} htmlFor={`report-${field.key}`}>
        {field.label}
        <input id={`report-${field.key}`} value={values[field.key]}
          placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value)} />
      </label>)}
      <label htmlFor="report-date">
        Tanggal berita acara
        <input id="report-date" type="date" value={values.reportDate}
          onChange={(event) => update("reportDate", event.target.value)} />
      </label>
    </div>
  </section>;
}
