import clsx from 'clsx'
import type { HTMLAttributes, JSX, ReactNode } from 'react'

import styles from './Card.module.scss'

type CardElevation = 'flat' | 'raised'
type CardPadding = 'none' | 'md'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  headerAction?: ReactNode
  footer?: ReactNode
  elevation?: CardElevation
  padding?: CardPadding
  className?: string
}

export function Card ({
  title,
  headerAction,
  footer,
  elevation = 'flat',
  padding = 'md',
  className = '',
  children,
  ...rest
}: CardProps): JSX.Element {
  const classes = clsx(
    styles.card,
    styles[`card${elevation[0].toUpperCase()}${elevation.slice(1)}`],
    className
  )

  return (
    <div className={classes} {...rest}>
      {title !== undefined && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {headerAction !== undefined && headerAction}
        </div>
      )}
      <div className={padding === 'none' ? styles.bodyNone : styles.body}>
        {children}
      </div>
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}