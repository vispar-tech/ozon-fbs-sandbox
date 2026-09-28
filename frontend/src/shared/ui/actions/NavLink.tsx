import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'
import { NavLink as RouterNavLink, type To } from 'react-router-dom'

import styles from './NavLink.module.scss'

interface NavLinkProps {
  to: To
  children: ReactNode
  end?: boolean
  className?: string
}

export function NavLink({ to, children, end = false, className = '' }: NavLinkProps): JSX.Element {
  return (
    <RouterNavLink
      to={to}
      end={end}
      aria-current='page'
      className={({ isActive }) =>
        clsx(styles.navLink, isActive && styles.navLinkActive, className)
      }
    >
      {children}
    </RouterNavLink>
  )
}
