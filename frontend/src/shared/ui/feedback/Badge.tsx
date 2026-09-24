import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './Badge.module.scss'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  dot?: boolean
  className?: string
}

type BadgeVariant = 'default' | 'blue' | 'green' | 'orange' | 'red' | 'magenta'
type BadgeSize = 'sm' | 'md' | 'lg'

export function Badge ({
  variant = 'default',
  size = 'md',
  children,
  dot = false,
  className = ''
}: BadgeProps): JSX.Element {
  const classes = clsx(
    styles.badge,
    styles[`badge${variant[0].toUpperCase()}${variant.slice(1)}`],
    size !== 'md' && styles[`badge${size[0].toUpperCase()}${size.slice(1)}`],
    className
  )

  return (
    <span className={classes}>
      {dot && <span aria-hidden='true' className={styles.dot} />}
      {children}
    </span>
  )
}