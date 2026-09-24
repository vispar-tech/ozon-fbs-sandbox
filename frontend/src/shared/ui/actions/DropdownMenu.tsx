import { autoUpdate, useFloating } from '@floating-ui/react-dom'
import clsx from 'clsx'
import { cloneElement, isValidElement, type JSX, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useRef, useState } from 'react'

import styles from './DropdownMenu.module.scss'

import { useOutsideClick } from '@/shared/hooks/useOutsideClick.js'
import { mergeRefs } from '@/shared/lib/refs.js'
import { Portal } from '@/shared/ui/Portal.js'

const NO_ACTIVE_ITEM_INDEX = -1

export interface DropdownMenuItem {
  label: string
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
}

export interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownMenuItem[]
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenu ({ trigger, items, onOpenChange }: DropdownMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'bottom-start',
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate
  })
  const openRef = useRef(open)
  const onOpenChangeRef = useRef(onOpenChange)
  openRef.current = open
  onOpenChangeRef.current = onOpenChange

  function updateOpen (next: boolean): void {
    setOpen(next)
    onOpenChangeRef.current?.(next)
  }

  function handleTriggerClick (): void {
    if (open) {
      updateOpen(false)
      return
    }
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    updateOpen(true)
  }

  useOutsideClick(panelRef, (event) => {
    if (!openRef.current) {
      return
    }
    if (event.target instanceof Node && triggerRef.current?.contains(event.target) === true) {
      return
    }
    updateOpen(false)
    previouslyFocusedRef.current?.focus()
  })

  useEffect(() => {
    if (!open) {
      return
    }
    const { current: previouslyFocused } = previouslyFocusedRef
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        updateOpen(false)
        previouslyFocused?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const firstItem = panelRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
    firstItem?.focus()
  }, [open])

  function handlePanelKeyDown (event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }
    event.preventDefault()
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])
    if (items.length === 0) {
      return
    }
    const currentIndex = getActiveItemIndex(items)
    if (currentIndex === NO_ACTIVE_ITEM_INDEX) {
      items[event.key === 'ArrowDown' ? 0 : items.length - 1].focus()
      return
    }
    const nextIndex = event.key === 'ArrowDown'
      ? (currentIndex + 1) % items.length
      : (currentIndex - 1 + items.length) % items.length
    items[nextIndex].focus()
  }

  function handleItemSelect (item: DropdownMenuItem): void {
    item.onSelect?.()
    updateOpen(false)
    previouslyFocusedRef.current?.focus()
  }

  return (
    <span ref={mergeRefs(triggerRef, refs.setReference)} className={styles.trigger}>
      {renderTrigger(trigger, open, handleTriggerClick)}
      {open && (
        <Portal>
          <div
            ref={mergeRefs(panelRef, refs.setFloating)}
            role='menu'
            className={styles.panel}
            style={floatingStyles}
            onKeyDown={handlePanelKeyDown}
          >
            {items.map((item, index) => (
              <button
                key={`${index}-${item.label}`}
                type='button'
                role='menuitem'
                className={clsx(styles.item, item.danger === true && styles.itemDanger)}
                disabled={item.disabled}
                onClick={() => { handleItemSelect(item) }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </span>
  )
}

function getActiveItemIndex (items: HTMLButtonElement[]): number {
  const { activeElement } = document
  return activeElement instanceof HTMLButtonElement ? items.indexOf(activeElement) : NO_ACTIVE_ITEM_INDEX
}

function renderTrigger (trigger: ReactNode, open: boolean, onClick: () => void): ReactNode {
  if (isValidElement<{ onClick?: (event: ReactMouseEvent) => void; 'aria-haspopup'?: 'menu'; 'aria-expanded'?: boolean }>(trigger)) {
    return cloneElement(trigger, {
      onClick: (event: ReactMouseEvent) => {
        trigger.props.onClick?.(event)
        onClick()
      },
      'aria-haspopup': 'menu',
      'aria-expanded': open
    })
  }
  return (
    <button type='button' className={styles.trigger} onClick={onClick} aria-haspopup='menu' aria-expanded={open}>
      {trigger}
    </button>
  )
}

