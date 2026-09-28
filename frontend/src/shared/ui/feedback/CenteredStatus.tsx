import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './CenteredStatus.module.scss'
import { ErrorBanner } from './ErrorBanner.js'
import { Spinner } from './Spinner.js'

import { Button } from '@/shared/ui/actions/index.js'

const RETRY_LABEL = 'Повторить'

interface CenteredStatusBaseProps {
  className?: string
  minHeight?: string
}

// The frame behind CODE_STYLE's four-state screen. Loading and error own their
// element (banner + retry is the repeated half); `empty` takes a ready node so
// the wide EmptyState API stays where it is instead of being mirrored here.
type CenteredStatusProps = CenteredStatusBaseProps & (
  | { status: 'loading'; label?: string | undefined; children?: ReactNode }
  | { status: 'error'; message: string; title?: string | undefined; onRetry?: (() => void) | undefined; children?: ReactNode }
  | { status: 'empty'; children: ReactNode }
)

export function CenteredStatus (props: CenteredStatusProps): JSX.Element {
  const { className = '', minHeight } = props
  const frameStyle = minHeight === undefined ? undefined : { minHeight }

  return (
    <div className={clsx(styles.centeredStatus, className)} style={frameStyle}>
      {renderContent(props)}
    </div>
  )
}

function renderContent (props: CenteredStatusProps): JSX.Element {
  switch (props.status) {
    case 'loading': {
      const { label, children } = props
      return (
        <>
          <Spinner size='lg' {...(label === undefined ? {} : { label })} />
          {children}
        </>
      )
    }
    case 'error': {
      const { title, message, onRetry, children } = props
      return (
        <>
          <ErrorBanner {...(title === undefined ? {} : { title })} message={message} />
          {onRetry !== undefined && (
            <Button variant='secondary' onClick={onRetry}>
              {RETRY_LABEL}
            </Button>
          )}
          {children}
        </>
      )
    }
    case 'empty':
      return <>{props.children}</>
  }
}
