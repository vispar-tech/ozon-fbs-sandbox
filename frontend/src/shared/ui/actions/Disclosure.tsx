import { ChevronRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './Disclosure.module.scss'
import { Icon } from './Icon.js'

type DisclosureSize = 'md' | 'sm'

interface DisclosureProps {
  expanded: boolean
  onToggle: () => void
  size?: DisclosureSize
  children: ReactNode
}

export function Disclosure ({ expanded, onToggle, size = 'md', children }: DisclosureProps): JSX.Element {
  const classes = clsx(
    styles.disclosure,
    styles[`disclosure${size.charAt(0).toUpperCase()}${size.slice(1)}`]
  )

  return (
    <button type='button' className={classes} aria-expanded={expanded} onClick={onToggle}>
      <Icon
        icon={ChevronRightIcon}
        size='xs'
        className={clsx(styles.chevron, expanded && styles.chevronOpen)}
      />
      {children}
    </button>
  )
}
