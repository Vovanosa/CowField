import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'

import { ErrorScreen } from '../components/ErrorBoundary'
import { reportUnexpectedError } from './reportUnexpectedError'

/**
 * The router's `errorElement`. React Router catches a throw from any descendant and renders the
 * nearest one of these instead of unmounting the tree, so a broken page no longer takes the app
 * down with it.
 *
 * Attached at two depths in `AppRouter`: inside the app shell, so a page error keeps the
 * navigation usable, and on the shell routes themselves, for a throw in the shell.
 */
export function RouteErrorElement() {
  const error = useRouteError()

  useEffect(() => {
    reportUnexpectedError(error, 'route')
  }, [error])

  return <ErrorScreen />
}
