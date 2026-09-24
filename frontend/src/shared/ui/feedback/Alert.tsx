import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './Alert.module.scss'

import { IconButton } from '@/shared/ui/actions/index.js'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  tone?: AlertTone
  title: string
  description?: string
  dismissible?: boolean
  onClose?: () => void
  className?: string
}

export function Alert ({
  tone = 'info',
  title,
  description,
  dismissible = false,
  onClose,
  className = ''
}: AlertProps): JSX.Element {
  const classes = clsx(
    styles.alert,
    styles[`alert${tone[0].toUpperCase()}${tone.slice(1)}`],
    className
  )

  return (
    <div className={classes} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className={styles.dot} aria-hidden='true' />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {description !== undefined && <p className={styles.description}>{description}</p>}
      </div>
      {dismissible && onClose !== undefined && (
        <IconButton icon={XMarkIcon} ariaLabel='Закрыть' onClick={onClose} />
      )}
    </div>
  )
}