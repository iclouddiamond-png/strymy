const rawApiBase = import.meta.env.VITE_API_URL?.trim() ?? ''

const normalizedApiBase = rawApiBase.replace(/\/+$/, '')

export const API_URL = normalizedApiBase || (import.meta.env.DEV ? '/api' : 'https://strymy.onrender.com/api')

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_URL}${normalizedPath}`
}