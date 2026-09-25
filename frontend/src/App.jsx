import { useEffect, useMemo, useState } from "react";
import { fetchProjects, generateDocument, getSession, login, logout, refreshProjects } from "./api.js";
import ExportActionBar from "./components/ExportActionBar.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import PageHeader from "./components/PageHeader.jsx";
import ProjectFilters from "./components/ProjectFilters.jsx";
import ProjectTable from "./components/ProjectTable.jsx";
import ReportDetailsForm from "./components/ReportDetailsForm.jsx";
import StatsGrid from "./components/StatsGrid.jsx";
import StatusAlerts from "./components/StatusAlerts.jsx";
import { parseAmount, parseInputDate, sortProjects } from "./utils/projects.js";

export default function App() {
  const [authState, setAuthState] = useState("checking");
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [wokFilter, setWokFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortKey, setSortKey] = useState("no");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [exportFilename, setExportFilename] = useState("");
  const [reportDetails, setReportDetails] = useState({
    projectTitle: "",
    contractNumber: "",
    spNumber: "",
    executor: "PT. TELKOM AKSES",
    district: "Semarang",
    reportDate: new Date().toISOString().slice(0, 10),
  });

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesSearch = !query || Object.values(project).some(
        (value) => String(value || "").toLowerCase().includes(query),
      );
      const matchesDate = !dateFilter
        || parseInputDate(project.tanggalInput) === parseInputDate(dateFilter);
      return matchesSearch && matchesDate
        && (wokFilter === "all" || project.wok === wokFilter);
    });
    return sortProjects(filtered, sortKey, sortDir);
  }, [projects, search, wokFilter, dateFilter, sortKey, sortDir]);

  const wokOptions = useMemo(
    () => [...new Set(projects.map((project) => project.wok).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "id")),
    [projects],
  );
  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.has(project.ihldLopId)),
    [projects, selectedIds],
  );
  const selectedBoq = useMemo(
    () => selectedProjects.reduce((total, project) => total + parseAmount(project.totalBoq), 0),
    [selectedProjects],
  );
  const totalBoq = useMemo(
    () => projects.reduce((total, project) => total + parseAmount(project.totalBoq), 0),
    [projects],
  );

  function pruneSelection(data) {
    setSelectedIds((previous) => {
      const availableIds = new Set(data.map((project) => project.ihldLopId));
      return new Set([...previous].filter((id) => availableIds.has(id)));
    });
  }

  function handleApiError(error) {
    if (error.status === 401) {
      setAuthState("unauthenticated");
      setProjects([]);
      setSelectedIds(new Set());
    }
    setErrorMsg(error.message);
  }

  async function loadProjects(searchTerm = "") {
    setLoading(true);
    setErrorMsg("");
    setSyncMsg("");
    try {
      const { data } = await fetchProjects(searchTerm);
      setProjects(data);
      pruneSelection(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getSession()
      .then(({ authenticated }) => {
        setAuthState(authenticated ? "authenticated" : "unauthenticated");
        if (authenticated) loadProjects();
      })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  async function handleLogin(password) {
    await login(password);
    setAuthState("authenticated");
    await loadProjects();
  }

  async function handleLogout() {
    await logout();
    setAuthState("unauthenticated");
    setProjects([]);
    setSelectedIds(new Set());
  }

  function toggleSelect(id) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleProjects.map((project) => project.ihldLopId);
    const shouldClear = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((previous) => {
      const next = new Set(previous);
      visibleIds.forEach((id) => shouldClear ? next.delete(id) : next.add(id));
      return next;
    });
  }

  function handleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDir((previous) => previous === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextKey);
    setSortDir("asc");
  }

  async function handleRefresh() {
    setLoading(true);
    setErrorMsg("");
    setSyncMsg("");
    try {
      const { data, total } = await refreshProjects();
      setProjects(data);
      pruneSelection(data);
      setSyncMsg(`Data berhasil diperbarui. ${total} proyek terbaru dimuat dari Google Sheets.`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  function defaultFilename() {
    const date = new Date().toISOString().slice(0, 10);
    return selectedProjects.length === 1
      ? `BA_Drop_${selectedProjects[0].ihldLopId}_${date}`
      : `BA_Drop_${selectedProjects.length}_Proyek_${date}`;
  }

  async function handleGenerate(format) {
    if (selectedIds.size === 0) {
      setErrorMsg("Pilih setidaknya satu proyek sebelum membuat dokumen.");
      return;
    }
    setGenerating(true);
    setErrorMsg("");
    try {
      await generateDocument([...selectedIds], format, exportFilename || defaultFilename(), reportDetails);
    } catch (error) {
      handleApiError(error);
    } finally {
      setGenerating(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setWokFilter("all");
    setDateFilter("");
    setSortKey("no");
    setSortDir("asc");
    loadProjects();
  }

  if (authState === "checking") {
    return <main className="login-page"><p className="auth-loading">Memeriksa sesi...</p></main>;
  }

  if (authState === "unauthenticated") {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const allVisibleSelected = visibleProjects.length > 0
    && visibleProjects.every((project) => selectedIds.has(project.ihldLopId));

  return <main className="app-shell">
    <PageHeader loading={loading} onRefresh={handleRefresh} onLogout={handleLogout} />
    <StatsGrid totalData={projects.length} visibleData={visibleProjects.length}
      selectedData={selectedIds.size} totalBoq={totalBoq} />
    <ProjectFilters search={search} wokFilter={wokFilter} dateFilter={dateFilter}
      wokOptions={wokOptions} loading={loading} onSearchChange={setSearch}
      onWokChange={setWokFilter} onDateChange={setDateFilter} onReset={resetFilters} />
    {(errorMsg || syncMsg) && <StatusAlerts errorMessage={errorMsg} successMessage={syncMsg} />}
    <ReportDetailsForm values={reportDetails} onChange={setReportDetails} />
    <ProjectTable projects={visibleProjects} selectedIds={selectedIds} sortKey={sortKey} sortDir={sortDir}
      allVisibleSelected={allVisibleSelected} onSort={handleSort} onToggle={toggleSelect}
      onToggleAll={toggleSelectAllVisible} dateFilter={dateFilter} />
    <ExportActionBar selectedCount={selectedIds.size} selectedBoq={selectedBoq} filename={exportFilename}
      filenamePlaceholder={defaultFilename()} generating={generating} onFilenameChange={setExportFilename}
      onClear={() => setSelectedIds(new Set())} onGenerate={handleGenerate} />
  </main>;
}
