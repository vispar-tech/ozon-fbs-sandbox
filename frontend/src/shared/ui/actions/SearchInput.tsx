import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { ChangeEventHandler, InputHTMLAttributes, JSX, Ref } from 'react'

import styles from './SearchInput.module.scss'

import { Icon } from '@/shared/ui/actions/index.js'
import { buildDescribedBy, buildFieldId, FieldMessage, hasErrorMessage } from '@/shared/ui/inputs/field.js'
import fieldStyles from '@/shared/ui/inputs/field.module.scss'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'onChange'> {
  label?: string
  hint?: string
  error?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  onClear?: () => void
}

export function SearchInput ({
  label,
  hint,
  error,
  id,
  ref,
  value,
  onChange,
  onClear,
  placeholder,
  className = '',
  ...rest
}: SearchInputProps): JSX.Element {
  const inputId = buildFieldId('search', id, label)
  const hasError = hasErrorMessage(error)
  const ariaDescribedBy = buildDescribedBy(inputId, hasError, hint)
  const hasValue = value.length > 0

  return (
    <div className={fieldStyles.inputWrap}>
      {label !== undefined && (
        <label className={fieldStyles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.wrap}>
        <Icon icon={MagnifyingGlassIcon} size='sm' className={styles.icon} />
        <input
          ref={ref}
          id={inputId}
          type='search'
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(styles.searchInput, hasError && styles.searchInputError, className)}
          aria-invalid={hasError || undefined}
          aria-describedby={ariaDescribedBy}
          {...rest}
        />
        {hasValue && onClear !== undefined && (
          <button type='button' className={styles.clear} aria-label='Clear' onClick={onClear}>
            <Icon icon={XMarkIcon} size='xs' />
          </button>
        )}
      </div>
      <FieldMessage fieldId={inputId} hasError={hasError} error={error} hint={hint} />
    </div>
  )
}