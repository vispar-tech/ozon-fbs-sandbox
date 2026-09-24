import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { createContext, type JSX, type ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'

import styles from './Toast.module.scss'

import { IconButton } from '@/shared/ui/actions/index.js'
import { Portal } from '@/shared/ui/Portal.js'

const DEFAULT_TOAST_DURATION = 4000
const MAX_TOASTS = 3

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface ToastOptions {
  tone?: ToastTone
  title: string
  description?: string
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
  tone: ToastTone
  duration: number
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider ({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idPrefix = useId()
  const nextIdRef = useRef(0)

  const showToast = useCallback((options: ToastOptions): void => {
    const item: ToastItem = {
      ...options,
      id: `${idPrefix}-${nextIdRef.current}`,
      tone: options.tone ?? 'info',
      duration: options.duration ?? DEFAULT_TOAST_DURATION
    }
    nextIdRef.current += 1
    setToasts(prev => [item, ...prev].slice(0, MAX_TOASTS))
  }, [idPrefix])

  const dismissToast = useCallback((id: string): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal>
        <div className={styles.container} role='status'>
          {toasts.map(toast => (
            <ToastItemView key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  )
}

export function useToast (): ToastContextValue {
  const context = useContext(ToastContext)
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastItemViewProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

function ToastItemView ({ toast, onDismiss }: ToastItemViewProps): JSX.Element {
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(toast.duration)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    if (paused) {
      return
    }
    const startedAt = Date.now()
    const timeoutId = window.setTimeout(() => {
      onDismissRef.current(toast.id)
    }, remainingRef.current)
    return () => {
      window.clearTimeout(timeoutId)
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt))
    }
  }, [paused, toast.id])

  return (
    <div
      className={clsx(styles.toast, styles[`toast${toast.tone[0].toUpperCase()}${toast.tone.slice(1)}`])}
      role={toast.tone === 'danger' ? 'alert' : undefined}
      onMouseEnter={() => { setPaused(true) }}
      onMouseLeave={() => { setPaused(false) }}
      onFocus={() => { setPaused(true) }}
      onBlur={() => { setPaused(false) }}
    >
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.dot} aria-hidden='true' />
          <p className={styles.title}>{toast.title}</p>
        </div>
        {toast.description !== undefined && <p className={styles.description}>{toast.description}</p>}
      </div>
      <IconButton icon={XMarkIcon} ariaLabel='Закрыть' onClick={() => { onDismiss(toast.id) }} />
    </div>
  )
}
