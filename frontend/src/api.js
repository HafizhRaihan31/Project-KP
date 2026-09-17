function apiError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function getSession() {
  const res = await fetch("/api/auth/session");
  if (!res.ok) throw apiError("Gagal memeriksa session", res.status);
  return res.json();
}

export async function login(password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw apiError(body.error || "Gagal login", res.status);
  return body;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function fetchProjects(search = "") {
  const res = await fetch(`/api/projects?search=${encodeURIComponent(search)}`);
  if (!res.ok) throw apiError(res.status === 401 ? "Session berakhir. Silakan login kembali." : "Gagal mengambil daftar proyek", res.status);
  return res.json();
}

export async function refreshProjects(search = "") {
  const res = await fetch(`/api/projects/refresh?search=${encodeURIComponent(search)}`, { method: "POST" });
  if (!res.ok) throw apiError(res.status === 401 ? "Session berakhir. Silakan login kembali." : "Gagal refresh data", res.status);
  return res.json();
}

/**
 * Minta backend generate dokumen, lalu trigger download di browser.
 */
export async function generateDocument(ids, format, filename = "", reportDetails = {}) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, format, filename, reportDetails }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw apiError(err.error || "Gagal generate dokumen", res.status);
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
