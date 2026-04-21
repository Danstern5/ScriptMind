const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function handleResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.detail || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiPost(path, body, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiGet(path, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders(token) },
  });
  return handleResponse(response);
}

export async function apiPut(path, body, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiDelete(path, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { ...authHeaders(token) },
  });
  return handleResponse(response);
}
