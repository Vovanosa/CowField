/**
 * Reads one Vite env var in a way that also survives outside Vite.
 *
 * Written plainly, `import.meta.env.VITE_API_BASE_URL` **throws** under `tsx`, where `import.meta`
 * exists but carries no `env` — which is the only reason the storage layer could not be exercised
 * outside a browser build. Reading it inside a `try` keeps both halves:
 *
 * - **under Vite** the expression is still the literal member access Vite's `define` matches, so it
 *   is replaced with *that one value* at build time. Reaching for `import.meta.env` as a whole (via
 *   a cast and `?.`, the obvious alternative) makes Vite inline the entire env object instead;
 * - **under `tsx`** the access throws, the `catch` answers `undefined`, and nothing blows up at
 *   import time.
 *
 * That is what lets the request-count harness import these modules for real rather than run against
 * a patched copy — and therefore what makes the request-count gate re-runnable.
 */
function readEnvVar(read: () => string | undefined) {
  try {
    return read()
  } catch {
    return undefined
  }
}

function normalizeBaseUrl(value: string | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(readEnvVar(() => import.meta.env.VITE_API_BASE_URL))
}

export function getNeonAuthUrl() {
  return readEnvVar(() => import.meta.env.VITE_NEON_AUTH_URL)?.trim() ?? ''
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}
