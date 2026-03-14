const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/admin'

export async function apiRequest(path, options = {}, token) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message =
      payload?.message ||
      (payload?.errors ? Object.values(payload.errors).flat().join(' ') : 'Une erreur est survenue.')

    throw new Error(message)
  }

  return payload
}

export { API_BASE_URL }

