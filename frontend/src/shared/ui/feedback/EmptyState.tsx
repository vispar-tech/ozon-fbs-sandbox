import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './EmptyState.module.scss'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState ({
  icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps): JSX.Element {
  return (
    <div className={clsx(styles.empty, className)}>
      {icon !== undefined && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description !== undefined && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}