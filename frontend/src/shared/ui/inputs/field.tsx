import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './field.module.scss'

const WS_PATTERN = /\s+/v

export function hasErrorMessage (error: string | undefined): boolean {
  return error !== undefined && error.length > 0
}

export function buildFieldId (prefix: string, id: string | undefined, label: string | undefined): string | undefined {
  if (id !== undefined) {
    return id
  }
  if (label !== undefined) {
    return `${prefix}-${label.toLowerCase().replace(WS_PATTERN, '-')}`
  }
  return undefined
}

interface BuildFieldClassesOptions {
  styles: Record<string, string>
  base: 'input' | 'select' | 'textarea'
  size: string
  hasError: boolean
  className: string
}

export function buildFieldClasses ({ styles, base, size, hasError, className }: BuildFieldClassesOptions): string {
  return clsx(
    styles[base],
    size !== 'md' && styles[`${base}${size[0].toUpperCase()}${size.slice(1)}`],
    hasError && styles[`${base}Error`],
    className.length > 0 && className
  )
}

export function buildDescribedBy (fieldId: string | undefined, hasError: boolean, hint: string | undefined): string | undefined {
  if (hasError && fieldId !== undefined) {
    return `${fieldId}-error`
  }
  if (hint !== undefined && fieldId !== undefined) {
    return `${fieldId}-hint`
  }
  return undefined
}

interface FieldMessageProps {
  fieldId: string | undefined
  hasError: boolean
  error: string | undefined
  hint: string | undefined
}

export function FieldMessage ({ fieldId, hasError, error, hint }: FieldMessageProps): JSX.Element | null {
  if (hasError) {
    return (
      <span className={styles.errorText} id={fieldId === undefined ? undefined : `${fieldId}-error`} role='alert'>
        {error}
      </span>
    )
  }
  if (hint !== undefined) {
    return (
      <span className={styles.hintText} id={fieldId === undefined ? undefined : `${fieldId}-hint`}>
        {hint}
      </span>
    )
  }
  return null
}