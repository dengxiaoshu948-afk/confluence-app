// Simple API wrapper - calls the remote backend
const API_BASE = "https://vrkswoeg6jemc.kimi.site";

function getToken() {
  return localStorage.getItem("local_auth_token") || "";
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-local-auth-token": getToken() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(path: string, body?: unknown) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-local-auth-token": getToken(),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Resources
  getResources: () => apiGet("/api/resources"),
  getResource: (id: string) => apiGet(`/api/resource/${id}`),

  // Auth
  login: (username: string, password: string) =>
    apiPost("/api/auth/login", { username, password }),
  register: (username: string, password: string, name?: string) =>
    apiPost("/api/auth/register", { username, password, name }),

  // Upload
  uploadFile: (formData: FormData) =>
    fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      headers: { "x-local-auth-token": getToken() },
      body: formData,
    }).then((r) => r.json()),

  // User
  getMe: () => apiGet("/api/me"),
  logout: () => {
    localStorage.removeItem("local_auth_token");
    localStorage.removeItem("oauth_user");
    window.location.href = "#/";
  },
};
