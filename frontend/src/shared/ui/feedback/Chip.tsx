import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './Chip.module.scss'

import { Icon } from '@/shared/ui/actions/index.js'

interface ChipProps {
  active?: boolean
  removable?: boolean
  removeLabel?: string
  onRemove?: () => void
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function Chip ({
  active = false,
  removable = false,
  removeLabel = 'Удалить',
  onRemove,
  onClick,
  children,
  className = ''
}: ChipProps): JSX.Element {
  const { isInteractive, role, tabIndex } = resolveChipInteraction(onClick)
  const classes = clsx(
    styles.chip,
    isInteractive && styles.chipInteractive,
    active && styles.chipActive,
    className
  )

  return (
    <span
      className={classes}
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {children}
      {removable && (
        <button
          type='button'
          className={styles.remove}
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          aria-label={removeLabel}
        >
          <Icon icon={XMarkIcon} size='xs' />
        </button>
      )}
    </span>
  )
}

function resolveChipInteraction (onClick?: () => void): { isInteractive: boolean; role: 'button' | undefined; tabIndex: 0 | undefined } {
  const isInteractive = onClick !== undefined
  return {
    isInteractive,
    role: isInteractive ? 'button' : undefined,
    tabIndex: isInteractive ? 0 : undefined
  }
}
