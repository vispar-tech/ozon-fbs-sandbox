import { autoUpdate, size as sizeMiddleware, useFloating } from '@floating-ui/react-dom'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { type CSSProperties, type JSX, type KeyboardEvent, type Ref, type RefObject, useEffect, useId, useMemo, useRef, useState } from 'react'

import { buildDescribedBy, buildFieldClasses, buildFieldId, FieldMessage, hasErrorMessage } from './field.js'
import fieldStyles from './field.module.scss'
import styles from './Select.module.scss'

import { useOutsideClick } from '@/shared/hooks/useOutsideClick.js'
import { mergeRefs } from '@/shared/lib/refs.js'
import { Icon } from '@/shared/ui/actions/index.js'
import { Portal } from '@/shared/ui/Portal.js'

const NO_ACTIVE_ITEM_INDEX = -1

type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface SelectProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: Array<SelectOption<T>>
  size?: SelectSize
  label?: string
  ariaLabel?: string
  required?: boolean
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  id?: string
  className?: string
  ref?: Ref<HTMLButtonElement>
}

export function Select<T extends string = string> ({
  value,
  onChange,
  options,
  size = 'md',
  label,
  ariaLabel,
  required = false,
  error,
  hint,
  placeholder,
  disabled = false,
  searchable = false,
  id,
  className = '',
  ref
}: SelectProps<T>): JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'bottom-start',
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      sizeMiddleware({
        apply({ rects, elements }) {
          const { floating } = elements
          floating.style.minWidth = `${rects.reference.width}px`
        },
      }),
    ],
  })
  const openRef = useRef(open)
  openRef.current = open
  const menuId = useId()
  const selectId = buildFieldId('select', id, label)
  const labelId = buildLabelId(selectId, label)
  const hasError = hasErrorMessage(error)
  const classes = buildFieldClasses({ styles, base: 'select', size, hasError, className })
  const selectedOption = options.find((opt) => opt.value === value)
  const displayText = buildDisplayText(selectedOption, placeholder)
  const filteredOptions = useMemo(
    () => filterOptions(options, searchable, query),
    [options, searchable, query]
  )
  const triggerClasses = clsx(classes, selectedOption === undefined && styles.selectPlaceholder)
  const ariaDescribedBy = buildDescribedBy(selectId, hasError, hint)

  function handleTriggerClick (): void {
    if (open) {
      updateOpen(false)
      return
    }
    setQuery('')
    updateOpen(true)
  }

  function updateOpen (next: boolean, restoreFocus = false): void {
    setOpen(next)
    if (restoreFocus && !next) {
      triggerRef.current?.focus()
    }
  }

  function handleSelect (option: SelectOption<T>): void {
    onChange(option.value)
    updateOpen(false, true)
  }

  useOutsideClick(panelRef, (event) => {
    closeOnOutsideClick(event, openRef, triggerRef, () => { updateOpen(false, true) })
  })

  useEffect(() => registerEscapeClose(open, () => { updateOpen(false, true) }), [open])

  useEffect(() => {
    focusSelectedOption(panelRef, open, searchable)
  }, [open, searchable])

  return (
    <div className={fieldStyles.inputWrap}>
      {label !== undefined && (
        <label
          id={labelId}
          className={buildLabelClasses(required)}
          htmlFor={selectId}
        >
          {label}
        </label>
      )}
      <button
        ref={mergeRefs(triggerRef, ref, refs.setReference)}
        type='button'
        id={selectId}
        className={triggerClasses}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={menuId}
        aria-labelledby={labelId}
        aria-label={labelId === undefined ? ariaLabel : undefined}
        aria-invalid={hasError}
        aria-required={buildAriaRequired(required)}
        aria-describedby={ariaDescribedBy}
        onClick={handleTriggerClick}
      >
        <span>{displayText}</span>
        <Icon icon={ChevronDownIcon} size='xs' className={clsx(styles.chevron, open && styles.chevronOpen)} />
      </button>
      {renderPanel(open, floatingStyles, {
        menuId,
        searchable,
        query,
        onQueryChange: setQuery,
        options: filteredOptions,
        value,
        onSelect: handleSelect,
        onPanelKeyDown: (event) => { handlePanelKeyDown(event, panelRef) },
        onSearchKeyDown: (event) => { handleSearchKeyDown(event, panelRef) },
        panelRef,
        setFloating: refs.setFloating
      })}
      <FieldMessage fieldId={selectId} hasError={hasError} error={error} hint={hint} />
    </div>
  )
}

interface SelectPanelProps<T extends string = string> {
  style: CSSProperties
  menuId: string
  searchable: boolean
  query: string
  onQueryChange: (query: string) => void
  options: Array<SelectOption<T>>
  value: T
  onSelect: (option: SelectOption<T>) => void
  onPanelKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  panelRef: RefObject<HTMLDivElement | null>
  setFloating: (node: HTMLDivElement | null) => void
}

function SelectPanel<T extends string = string> ({
  style,
  menuId,
  searchable,
  query,
  onQueryChange,
  options,
  value,
  onSelect,
  onPanelKeyDown,
  onSearchKeyDown,
  panelRef,
  setFloating
}: SelectPanelProps<T>): JSX.Element {
  return (
    <Portal>
      <div
        ref={mergeRefs(panelRef, setFloating)}
        className={styles.panel}
        style={style}
        onKeyDown={onPanelKeyDown}
      >
        {searchable && (
          <input
            type='text'
            className={styles.search}
            placeholder='Поиск...'
            aria-label='Search options'
            autoFocus
            value={query}
            onChange={(event) => { onQueryChange(event.target.value) }}
            onKeyDown={onSearchKeyDown}
          />
        )}
        <div id={menuId} role='listbox' className={styles.listbox}>
          {options.length === 0
            ? <div className={styles.empty}>Ничего не найдено</div>
            : options.map((opt) => (
              <button
                key={opt.value}
                type='button'
                role='option'
                className={clsx(styles.option, opt.value === value && styles.optionSelected)}
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled}
                disabled={opt.disabled}
                onClick={() => { onSelect(opt) }}
              >
                {opt.label}
              </button>
            ))}
        </div>
      </div>
    </Portal>
  )
}

function renderPanel<T extends string = string> (open: boolean, style: CSSProperties, panelProps: Omit<SelectPanelProps<T>, 'style'>): JSX.Element | null {
  if (!open) {
    return null
  }
  return <SelectPanel style={style} {...panelProps} />
}

function buildLabelId (selectId: string | undefined, label: string | undefined): string | undefined {
  return selectId === undefined || label === undefined ? undefined : `${selectId}-label`
}

function buildDisplayText<T extends string = string> (selectedOption: SelectOption<T> | undefined, placeholder: string | undefined): string | undefined {
  return selectedOption?.label ?? placeholder
}

function buildLabelClasses (required: boolean): string {
  return required ? `${fieldStyles.label} ${fieldStyles.labelRequired}` : fieldStyles.label
}

function buildAriaRequired (required: boolean): boolean | undefined {
  return required || undefined
}

function handlePanelKeyDown (event: KeyboardEvent<HTMLDivElement>, panelRef: RefObject<HTMLDivElement | null>): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return
  }
  event.preventDefault()
  const items = getEnabledOptions(panelRef)
  if (items.length === 0) {
    return
  }
  const currentIndex = getActiveOptionIndex(items)
  if (currentIndex === NO_ACTIVE_ITEM_INDEX) {
    focusOption(items[event.key === 'ArrowDown' ? 0 : items.length - 1])
    return
  }
  const nextIndex = event.key === 'ArrowDown'
    ? (currentIndex + 1) % items.length
    : (currentIndex - 1 + items.length) % items.length
  focusOption(items[nextIndex])
}

function handleSearchKeyDown (event: KeyboardEvent<HTMLInputElement>, panelRef: RefObject<HTMLDivElement | null>): void {
  if (event.key !== 'Enter') {
    return
  }
  const items = getEnabledOptions(panelRef)
  if (items.length === 0) {
    return
  }
  items[0].click()
}

function filterOptions<T extends string = string> (options: Array<SelectOption<T>>, searchable: boolean, query: string): Array<SelectOption<T>> {
  if (!searchable || query.length === 0) {
    return options
  }
  const normalized = query.toLowerCase()
  return options.filter((opt) => opt.label.toLowerCase().includes(normalized))
}

function getEnabledOptions (panelRef: RefObject<HTMLDivElement | null>): HTMLButtonElement[] {
  return Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? [])
}

function getActiveOptionIndex (items: HTMLButtonElement[]): number {
  const { activeElement } = document
  return activeElement instanceof HTMLButtonElement ? items.indexOf(activeElement) : NO_ACTIVE_ITEM_INDEX
}

function focusOption (option: HTMLButtonElement | null | undefined): void {
  if (option === null || option === undefined) {
    return
  }
  option.focus()
  option.scrollIntoView({ block: 'nearest' })
}

function closeOnOutsideClick (
  event: MouseEvent | TouchEvent,
  openRef: RefObject<boolean>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  close: () => void
): void {
  if (!openRef.current) {
    return
  }
  if (event.target instanceof Node && triggerRef.current?.contains(event.target) === true) {
    return
  }
  close()
}

function registerEscapeClose (open: boolean, onEscape: () => void): (() => void) | undefined {
  if (!open) {
    return undefined
  }
  const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      onEscape()
    }
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}

function focusSelectedOption (panelRef: RefObject<HTMLDivElement | null>, open: boolean, searchable: boolean): void {
  if (!open || searchable) {
    return
  }
  const selected = panelRef.current?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]:not(:disabled)')
  const first = panelRef.current?.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)')
  focusOption(selected ?? first)
}