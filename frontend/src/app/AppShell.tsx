import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import styles from './AppShell.module.scss'

import { useTheme } from '@/shared/hooks/index.js'
import { Button, Icon } from '@/shared/ui/actions/index.js'

const NAV_ITEMS = [
  { to: '/', label: 'Продавцы' }
]

export function AppShell (): JSX.Element {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to='/' className={styles.logo}>OZON Sandbox</Link>
        <nav className={styles.nav} aria-label='Основная навигация'>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.navLink}${location.pathname === item.to ? ` ${styles.navLinkActive}` : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button
          variant='ghost'
          className={styles.themeToggle}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-pressed={theme === 'dark'}
          onClick={toggleTheme}
          icon={theme === 'light'
            ? <Icon icon={MoonIcon} size='md' />
            : <Icon icon={SunIcon} size='md' />
          }
        />
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  )
}
