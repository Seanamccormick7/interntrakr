const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

function getBaseUrl() {
  if (!BASE_URL) {
    return ''
  }
  return BASE_URL.replace(/\/+$/, '')
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`
  const res = await fetch(url, {
    ...init,
    headers: { accept: 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET ${path} failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}
