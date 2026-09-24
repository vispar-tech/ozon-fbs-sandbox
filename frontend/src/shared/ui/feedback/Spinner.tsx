import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './Spinner.module.scss'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

interface SpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
}

export function Spinner ({
  size = 'md',
  label = 'Загрузка',
  className = ''
}: SpinnerProps): JSX.Element {
  return (
    <span
      className={clsx(styles.spinner, styles[`spinner${size[0].toUpperCase()}${size.slice(1)}`], className)}
      role='status'
      aria-label={label}
    />
  )
}