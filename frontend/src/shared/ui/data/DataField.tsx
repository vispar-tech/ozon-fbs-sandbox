import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './DataField.module.scss'
import { Eyebrow } from './Eyebrow.js'

const EMPTY_TEXT = 'Не указано'

interface DataFieldProps {
  label: string
  value: string
  mono?: boolean
  note?: ReactNode
  className?: string
}

export function DataField({
  label,
  value,
  mono = false,
  note,
  className = '',
}: DataFieldProps): JSX.Element {
  const empty = value.trim() === ''

  return (
    <dl className={clsx(styles.field, className)}>
      <dt>
        <Eyebrow>{label}</Eyebrow>
      </dt>
      <dd className={clsx(styles.value, mono && styles.valueMono, empty && styles.valueEmpty)}>
        {empty ? EMPTY_TEXT : value}
      </dd>
      {note !== undefined && <dd className={styles.note}>{note}</dd>}
    </dl>
  )
}
