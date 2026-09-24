import { XMarkIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './ErrorBanner.module.scss'

import { Icon, IconButton } from '@/shared/ui/actions/index.js'

interface ErrorBannerProps {
  title?: string
  message: string
  onDismiss?: () => void
  className?: string
}

export function ErrorBanner ({
  title = 'Error',
  message,
  onDismiss,
  className = ''
}: ErrorBannerProps): JSX.Element {
  return (
    <div className={clsx(styles.banner, className)} role='alert'>
      <Icon icon={ExclamationCircleIcon} size='md' variant='danger' className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.message}>{message}</p>
      </div>
      {onDismiss !== undefined && (
        <IconButton icon={XMarkIcon} ariaLabel='Dismiss error' onClick={onDismiss} />
      )}
    </div>
  )
}