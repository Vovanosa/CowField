function normalizeBaseUrl(value: string | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}

