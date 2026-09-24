import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorPage } from '@/pages/error/index.js'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError (error: Error): ErrorBoundaryState {
    return { error }
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- componentDidCatch is a required React lifecycle hook
  componentDidCatch (error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error:', error, info.componentStack) // eslint-disable-line no-console -- intentional error logging
  }

  handleReset = (): void => {
    this.setState({ error: null })
  }

  render (): ReactNode {
    if (this.state.error !== null) {
      return <ErrorPage variant='error' onRetry={this.handleReset} />
    }
    return this.props.children
  }
}