import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './Meter.module.scss'

const HUNDRED_PERCENT = 100

interface MeterProps {
  value: number
  max: number
  label: string
  className?: string
}

export function Meter({ value, max, label, className = '' }: MeterProps): JSX.Element {
  const percent = max === 0 ? 0 : Math.round((value / max) * HUNDRED_PERCENT)

  return (
    <div
      className={clsx(styles.meter, className)}
      role='progressbar'
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span className={styles.meterFill} style={{ width: `${percent}%` }} />
    </div>
  )
}
