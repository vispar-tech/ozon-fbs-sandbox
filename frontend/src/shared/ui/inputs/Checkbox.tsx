import { CheckIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { type JSX, type Ref, useEffect, useId, useRef } from 'react'

import styles from './Checkbox.module.scss'
import { buildDescribedBy, hasErrorMessage } from './field.js'
import fieldStyles from './field.module.scss'

import { mergeRefs } from '@/shared/lib/index.js'
import { Icon } from '@/shared/ui/actions/index.js'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  ariaLabel?: string
  disabled?: boolean
  indeterminate?: boolean
  error?: string
  id?: string
  className?: string
  ref?: Ref<HTMLInputElement>
}

export function Checkbox ({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  indeterminate = false,
  error,
  id,
  className = '',
  ref
}: CheckboxProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hasError = hasErrorMessage(error)
  const ariaDescribedBy = buildDescribedBy(inputId, hasError, undefined)

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <span className={fieldStyles.inputWrap}>
      <label
        className={clsx(styles.checkbox, hasError && styles.checkboxError, className)}
        htmlFor={inputId}
      >
        <input
          ref={mergeRefs(inputRef, ref)}
          id={inputId}
          type='checkbox'
          className={styles.input}
          checked={checked}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          onChange={(e) => { onChange(e.target.checked) }}
        />
        <span className={styles.box} aria-hidden='true'>
          <Icon icon={CheckIcon} size='xs' className={styles.checkmark} />
          <span className={styles.dash} />
        </span>
        {label !== undefined && <span className={styles.label}>{label}</span>}
      </label>
      {hasError && (
        <span className={fieldStyles.errorText} id={`${inputId}-error`} role='alert'>
          {error}
        </span>
      )}
    </span>
  )
}