export async function fetchProjects(search = "") {
  const res = await fetch(`/api/projects?search=${encodeURIComponent(search)}`);
  if (!res.ok) throw new Error("Gagal mengambil daftar proyek");
  return res.json();
}

export async function refreshProjects(search = "") {
  const res = await fetch(`/api/projects/refresh?search=${encodeURIComponent(search)}`, { method: "POST" });
  if (!res.ok) throw new Error("Gagal refresh data");
  return res.json();
}

/**
 * Minta backend generate dokumen, lalu trigger download di browser.
 */
export async function generateDocument(ids, format, filename = "") {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, format, filename }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal generate dokumen");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename=(.+)/);
  const downloadFilename = match ? match[1].replace(/^"|"$/g, "") : `dokumen.${format}`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
