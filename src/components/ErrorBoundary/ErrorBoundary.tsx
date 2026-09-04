import { Component, type ErrorInfo, type ReactNode } from 'react'

import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { ErrorScreen } from './ErrorScreen'

type ErrorBoundaryProps = {
  children: ReactNode
  /** Names the part of the tree that threw, so the console line says where to look. */
  context?: string
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * The last line of defence against a render-time throw.
 *
 * React unmounts the entire tree when a render throws and nothing catches it, which is exactly how
 * a single bad value used to turn the whole app into a blank white page with nothing logged. This
 * is a class component because `getDerivedStateFromError` and `componentDidCatch` have no hook
 * equivalent.
 *
 * Route-level errors are handled by the router instead — see `RouteErrorElement`. This one covers
 * everything above the router, where there is no `errorElement` to fall back to.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    reportUnexpectedError(error, this.props.context ?? errorInfo.componentStack ?? undefined)
  }

  render() {
    return this.state.hasError ? <ErrorScreen /> : this.props.children
  }
}
