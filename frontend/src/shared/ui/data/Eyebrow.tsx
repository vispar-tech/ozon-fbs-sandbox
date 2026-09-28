import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './Eyebrow.module.scss'

interface EyebrowProps {
  children: ReactNode
  className?: string
}

export function Eyebrow({ children, className = '' }: EyebrowProps): JSX.Element {
  return <span className={clsx(styles.eyebrow, className)}>{children}</span>
}
