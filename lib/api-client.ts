// Cliente para hacer peticiones a la API desde el frontend

export interface ApiError {
  error: string
}

// Función helper para hacer fetch con manejo de errores
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Incluir cookies
  })

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'Error desconocido',
    }))
    throw new Error(error.error || `Error: ${response.statusText}`)
  }

  return response.json()
}

// GET request
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'GET' })
}

// POST request
export async function apiPost<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT request
export async function apiPut<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// DELETE request
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'DELETE' })
}

// Login
export async function login(username: string, password: string) {
  return apiPost<{ id: string; name: string; username: string }>(
    'auth/login',
    { username, password }
  )
}

// Logout
export async function logout() {
  return apiPost('auth/logout')
}

// Obtener usuario actual
export async function getCurrentUser() {
  return apiGet<{ id: string; name: string; username: string } | null>(
    'auth/me'
  )
}

