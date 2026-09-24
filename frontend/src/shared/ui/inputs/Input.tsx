import type { InputHTMLAttributes, JSX, Ref } from 'react'

import { buildDescribedBy, buildFieldClasses, buildFieldId, FieldMessage, hasErrorMessage } from './field.js'
import fieldStyles from './field.module.scss'
import styles from './Input.module.scss'

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize
  label?: string
  required?: boolean
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
}

export function Input ({
  size = 'md',
  label,
  required = false,
  error,
  hint,
  className = '',
  id,
  ref,
  ...rest
}: InputProps): JSX.Element {
  const inputId = buildFieldId('input', id, label)
  const hasError = hasErrorMessage(error)
  const classes = buildFieldClasses({ styles, base: 'input', size, hasError, className })
  const ariaDescribedBy = buildDescribedBy(inputId, hasError, hint)

  return (
    <div className={fieldStyles.inputWrap}>
      {label !== undefined && (
        <label
          className={required ? `${fieldStyles.label} ${fieldStyles.labelRequired}` : fieldStyles.label}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={classes}
        aria-invalid={hasError || undefined}
        aria-describedby={ariaDescribedBy}
        required={required}
        {...rest}
      />
      <FieldMessage fieldId={inputId} hasError={hasError} error={error} hint={hint} />
    </div>
  )
}
