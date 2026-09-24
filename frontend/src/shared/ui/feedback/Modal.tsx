import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { type JSX, type ReactNode, useEffect, useId, useRef } from 'react'

import styles from './Modal.module.scss'

import { useFocusTrap } from '@/shared/hooks/useFocusTrap.js'
import { useScrollLock } from '@/shared/hooks/useScrollLock.js'
import { IconButton } from '@/shared/ui/actions/index.js'
import { Portal } from '@/shared/ui/Portal.js'

const NEGATIVE_TAB_INDEX = -1

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  describedBy?: string
  children: ReactNode
  size?: ModalSize
  className?: string
}

export function Modal ({
  open,
  onClose,
  title,
  describedBy,
  children,
  size = 'md',
  className = ''
}: ModalProps): JSX.Element | null {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef, open)
  useScrollLock(open)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCloseRef.current()
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
    const root = document.getElementById('root')
    if (root === null) {
      return
    }
    const { inert: previousInert } = root
    root.inert = true
    return () => {
      root.inert = previousInert
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()
    return () => {
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) {
    return null
  }

  const dialogClasses = clsx(
    styles.modal,
    styles[`modal${size[0].toUpperCase()}${size.slice(1)}`],
    className
  )

  return (
    <Portal>
      <div className={styles.backdrop} onClick={onClose}>
        <div
          ref={dialogRef}
          role='dialog'
          aria-modal='true'
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          tabIndex={NEGATIVE_TAB_INDEX}
          className={dialogClasses}
          onClick={(event) => { event.stopPropagation() }}
        >
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            <IconButton icon={XMarkIcon} ariaLabel='Закрыть' onClick={onClose} />
          </header>
          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </Portal>
  )
}
