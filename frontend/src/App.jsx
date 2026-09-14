import { useEffect, useMemo, useState } from "react";
import { fetchProjects, refreshProjects, generateDocument } from "./api.js";

const sortLabels = {
  no: "No",
  ihldLopId: "IHLD Lop ID",
  wok: "WOK",
  namaProyek: "Nama proyek",
  totalBoq: "Total BOQ",
};

function parseAmount(value) {
  return Number(String(value || "0").replace(/[^\d]/g, "")) || 0;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function sortProjects(items, sortKey, sortDir) {
  const multiplier = sortDir === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const left = sortKey === "totalBoq" || sortKey === "no" ? parseAmount(a[sortKey]) : String(a[sortKey] || "");
    const right = sortKey === "totalBoq" || sortKey === "no" ? parseAmount(b[sortKey]) : String(b[sortKey] || "");

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * multiplier;
    }

    return left.localeCompare(right, "id", { numeric: true, sensitivity: "base" }) * multiplier;
  });
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [wokFilter, setWokFilter] = useState("all");
  const [sortKey, setSortKey] = useState("no");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [exportFilename, setExportFilename] = useState("");

  const visibleProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        Object.values(project).some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
      const matchesWok = wokFilter === "all" || project.wok === wokFilter;

      return matchesSearch && matchesWok;
    });

    return sortProjects(filtered, sortKey, sortDir);
  }, [projects, search, wokFilter, sortKey, sortDir]);

  const wokOptions = useMemo(() => {
    return [...new Set(projects.map((p) => p.wok).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
  }, [projects]);

  const selectedProjects = useMemo(() => {
    return projects.filter((p) => selectedIds.has(p.ihldLopId));
  }, [projects, selectedIds]);

  const selectedBoq = useMemo(() => {
    return selectedProjects.reduce((total, project) => total + parseAmount(project.totalBoq), 0);
  }, [selectedProjects]);

  const totalBoq = useMemo(() => {
    return projects.reduce((total, project) => total + parseAmount(project.totalBoq), 0);
  }, [projects]);

  async function loadProjects(searchTerm = "") {
    setLoading(true);
    setErrorMsg("");
    setSyncMsg("");
    try {
      const { data } = await fetchProjects(searchTerm);
      setProjects(data);
      pruneSelection(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function pruneSelection(data) {
    setSelectedIds((prev) => {
      const availableIds = new Set(data.map((p) => p.ihldLopId));
      return new Set([...prev].filter((id) => availableIds.has(id)));
    });
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleProjects.map((p) => p.ihldLopId);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setErrorMsg("");
    setSyncMsg("");
    try {
      const { data, total } = await refreshProjects();
      setProjects(data);
      pruneSelection(data);
      setSyncMsg(`Sinkron selesai. ${total} data terbaru dimuat dari Google Sheet.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  function defaultFilename() {
    const date = new Date().toISOString().slice(0, 10);
    if (selectedProjects.length === 1) {
      return `BA_Drop_${selectedProjects[0].ihldLopId}_${date}`;
    }

    return `BA_Drop_${selectedProjects.length}_Proyek_${date}`;
  }

  async function handleGenerate(format) {
    if (selectedIds.size === 0) {
      setErrorMsg("Pilih minimal satu proyek dulu.");
      return;
    }
    setGenerating(true);
    setErrorMsg("");
    try {
      await generateDocument(Array.from(selectedIds), format, exportFilename || defaultFilename());
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setWokFilter("all");
    setSortKey("no");
    setSortDir("asc");
    loadProjects("");
  }

  const allVisibleSelected =
    visibleProjects.length > 0 && visibleProjects.every((project) => selectedIds.has(project.ihldLopId));

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Google Sheets connected</p>
          <h1>Generator Dokumen Proyek</h1>
          <p className="subtitle">Pilih data drop project, sinkronkan dari Sheet, lalu generate laporan Word atau PDF.</p>
        </div>
        <button className="button primary" onClick={handleRefresh} disabled={loading}>
          {loading ? "Sinkron..." : "Sinkron dari Sheet"}
        </button>
      </section>

      <section className="stats-grid" aria-label="Ringkasan data">
        <div className="stat-card">
          <span>Total data</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="stat-card">
          <span>Ditampilkan</span>
          <strong>{visibleProjects.length}</strong>
        </div>
        <div className="stat-card">
          <span>Dipilih</span>
          <strong>{selectedIds.size}</strong>
        </div>
        <div className="stat-card wide">
          <span>Total BOQ data aktif</span>
          <strong>{formatRupiah(totalBoq)}</strong>
        </div>
      </section>

      <section className="toolbar" aria-label="Filter dan pencarian">
        <div className="search-box">
          <label htmlFor="project-search">Cari data</label>
          <input
            id="project-search"
            type="text"
            placeholder="Nama proyek, ID, WOK, atau keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="select-box">
          <label htmlFor="wok-filter">WOK</label>
          <select id="wok-filter" value={wokFilter} onChange={(e) => setWokFilter(e.target.value)}>
            <option value="all">Semua WOK</option>
            {wokOptions.map((wok) => (
              <option key={wok} value={wok}>
                {wok}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="button muted" onClick={resetFilters} disabled={loading}>
            Reset
          </button>
        </div>
      </section>

      {errorMsg && <p className="alert error">{errorMsg}</p>}
      {syncMsg && <p className="alert success">{syncMsg}</p>}

      <section className="table-panel">
        <div className="table-header">
          <div>
            <h2>Daftar Proyek</h2>
            <p>Urutkan kolom dan centang data yang ingin dimasukkan ke laporan.</p>
          </div>
          <span className="sort-chip">
            Urut: {sortLabels[sortKey]} {sortDir === "asc" ? "naik" : "turun"}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="check-cell">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                </th>
                {Object.entries(sortLabels).map(([key, label]) => (
                  <th key={key}>
                    <button className="sort-button" onClick={() => handleSort(key)}>
                      {label}
                      <span>{sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                    </button>
                  </th>
                ))}
                <th>Keterangan Drop</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((p) => (
                <tr key={p.ihldLopId} className={selectedIds.has(p.ihldLopId) ? "selected-row" : ""}>
                  <td className="check-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.ihldLopId)}
                      onChange={() => toggleSelect(p.ihldLopId)}
                    />
                  </td>
                  <td>{p.no}</td>
                  <td className="mono">{p.ihldLopId}</td>
                  <td>
                    <span className="wok-pill">{p.wok}</span>
                  </td>
                  <td className="project-name">{p.namaProyek}</td>
                  <td className="amount">{p.totalBoq}</td>
                  <td className="reason">{p.keteranganDrop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleProjects.length === 0 && (
          <div className="empty-state">
            <strong>Data tidak ditemukan</strong>
            <span>Coba ubah kata kunci pencarian atau filter WOK.</span>
          </div>
        )}
      </section>

      <section className={`action-bar ${selectedIds.size > 0 ? "visible" : ""}`}>
        <div>
          <strong>{selectedIds.size} proyek dipilih</strong>
          <span>Total BOQ terpilih: {formatRupiah(selectedBoq)}</span>
        </div>
        <label className="export-name-field" htmlFor="export-filename">
          Nama file
          <input
            id="export-filename"
            value={exportFilename}
            onChange={(e) => setExportFilename(e.target.value)}
            placeholder={defaultFilename()}
          />
        </label>
        <div className="action-buttons">
          <button className="button muted" onClick={() => setSelectedIds(new Set())} disabled={generating}>
            Kosongkan
          </button>
          <button className="button" onClick={() => handleGenerate("docx")} disabled={generating}>
            {generating ? "Memproses..." : "Download Word"}
          </button>
          <button className="button primary" onClick={() => handleGenerate("pdf")} disabled={generating}>
            {generating ? "Memproses..." : "Download PDF"}
          </button>
        </div>
      </section>
    </main>
  );
}
