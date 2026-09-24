import clsx from 'clsx'
import { type JSX, useId } from 'react'

import styles from './Toggle.module.scss'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Toggle ({
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}: ToggleProps): JSX.Element {
  const id = useId()

  return (
    <label className={clsx(styles.toggle, className)} htmlFor={id}>
      <input
        id={id}
        type='checkbox'
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.checked) }}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      {label !== undefined && <span className={styles.label}>{label}</span>}
    </label>
  )
}