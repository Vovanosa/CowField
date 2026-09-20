import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import i18n, { applyLanguage, normalizeLanguage } from './i18n'
import App from './App.tsx'
import { registerGlobalErrorHandlers, reportUnexpectedError } from './app/reportUnexpectedError'
import { ErrorBoundary } from './components/ErrorBoundary'

registerGlobalErrorHandlers()

function startApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary context="app root">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}

/**
 * **First paint waits for the language pack, and only ever actually waits for Ukrainian.**
 *
 * `./i18n` used to be imported for its side effect alone, because both dictionaries were in the
 * bundle and there was nothing to wait for. Ukrainian is a separate chunk since 2026-09-20, so a
 * reader landing directly on `/uk` needs it in hand before the first render or they see one frame of
 * English at a Ukrainian URL. For English — `/`, and every crawler — `applyLanguage` resolves
 * without touching the network, so this costs a microtask and nothing else.
 *
 * **It renders either way.** A dictionary that will not load is reported and then dropped: the keys
 * in this project are their own English text, so the app is readable with no resources at all, and
 * a blank page over a failed 19 KB fetch would be a far worse trade.
 */
void applyLanguage(normalizeLanguage(i18n.language))
  .catch((error) => reportUnexpectedError(error, 'setting the initial language'))
  .then(startApp)
