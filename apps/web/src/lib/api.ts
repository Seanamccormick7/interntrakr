const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

function getBaseUrl() {
  if (!BASE_URL) {
    return "";
  }
  return BASE_URL.replace(/\/+$/, "");
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { accept: "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  data?: unknown,
  init?: RequestInit,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method: "POST",
    ...init,
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      ...(init?.headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  data?: unknown,
  init?: RequestInit,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    ...init,
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      ...(init?.headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PATCH ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPut<T>(
  path: string,
  data?: unknown,
  init?: RequestInit,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    ...init,
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      ...(init?.headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PUT ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE ${path} failed: ${res.status} ${text}`);
  }
  // Handle empty response for DELETE
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// Helper to add auth token to requests
export function withAuth(token: string): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
