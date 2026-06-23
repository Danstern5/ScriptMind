const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function handleResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    const message =
      (detail && typeof detail === "object" && detail.message) ||
      (typeof detail === "string" && detail) ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.code = detail && typeof detail === "object" ? detail.code : undefined;
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

export async function apiStreamPost(path, body, token, onEvent, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error = new Error(data?.detail || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of block.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try { onEvent(JSON.parse(line.slice(6))); }
        catch { /* ignore malformed */ }
      }
    }
  }
}
