import { ref } from "vue";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

export { API_BASE };

export function assetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export const token = ref<string | null>(localStorage.getItem("admin_token"));
export const isAuthenticated = ref(!!token.value);

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token.value) {
    headers["Authorization"] = `Bearer ${token.value}`;
  }
  return headers;
};

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    token.value = data.token;
    isAuthenticated.value = true;
    localStorage.setItem("admin_token", data.token);
    return true;
  } catch {
    return false;
  }
}

export function logout() {
  token.value = null;
  isAuthenticated.value = false;
  localStorage.removeItem("admin_token");
}

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers || {}) },
  });

  if (res.status === 401) {
    logout();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

export async function uploadFile(file: File): Promise<{ url: string; r2Key: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.value}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
