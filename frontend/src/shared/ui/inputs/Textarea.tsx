import type { JSX, Ref, TextareaHTMLAttributes } from 'react'

import { buildDescribedBy, buildFieldClasses, buildFieldId, FieldMessage, hasErrorMessage } from './field.js'
import fieldStyles from './field.module.scss'
import styles from './Textarea.module.scss'

const DEFAULT_ROWS = 4

type TextareaSize = 'sm' | 'md' | 'lg'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: TextareaSize
  label?: string
  required?: boolean
  error?: string
  hint?: string
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea ({
  size = 'md',
  label,
  required = false,
  error,
  hint,
  rows = DEFAULT_ROWS,
  className = '',
  id,
  ref,
  ...rest
}: TextareaProps): JSX.Element {
  const textareaId = buildFieldId('textarea', id, label)
  const hasError = hasErrorMessage(error)
  const classes = buildFieldClasses({ styles, base: 'textarea', size, hasError, className })
  const ariaDescribedBy = buildDescribedBy(textareaId, hasError, hint)

  return (
    <div className={fieldStyles.inputWrap}>
      {label !== undefined && (
        <label
          className={required ? `${fieldStyles.label} ${fieldStyles.labelRequired}` : fieldStyles.label}
          htmlFor={textareaId}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={classes}
        aria-invalid={hasError || undefined}
        aria-describedby={ariaDescribedBy}
        required={required}
        {...rest}
      />
      <FieldMessage fieldId={textareaId} hasError={hasError} error={error} hint={hint} />
    </div>
  )
}