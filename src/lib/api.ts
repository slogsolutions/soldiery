const DEFAULT_API_URL =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'

const viteEnv = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env || {}
const BASE_URL = viteEnv.VITE_API_URL || DEFAULT_API_URL

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData

  // For FormData, do NOT set any Content-Type — browser must set it with the boundary
  const headers: HeadersInit = isFormData
    ? {}
    : {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = await res.json()
      message = data.error || message
    } catch {}
    throw new Error(message)
  }

  // Return undefined for 204 No Content instead of crashing on res.json()
  if (res.status === 204) return undefined as T

  return res.json()
}