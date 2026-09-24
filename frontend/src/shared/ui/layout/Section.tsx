import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './Section.module.scss'

interface SectionProps {
  title?: string
  actions?: ReactNode
  flush?: boolean
  children: ReactNode
  className?: string
}

export function Section ({
  title,
  actions,
  flush = false,
  children,
  className = ''
}: SectionProps): JSX.Element {
  const hasHeader = title !== undefined || actions !== undefined

  return (
    <div className={clsx(styles.section, className)}>
      {hasHeader && (
        <div className={styles.header}>
          {title !== undefined && <h3 className={styles.title}>{title}</h3>}
          {actions}
        </div>
      )}
      <div className={clsx(styles.body, flush && styles.bodyFlush)}>
        {children}
      </div>
    </div>
  )
}