import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'
import { Link, Outlet } from 'react-router-dom'

import styles from './AppShell.module.scss'

import { useTheme } from '@/shared/hooks/index.js'
import { IconButton, NavLink } from '@/shared/ui/actions/index.js'

export function AppShell(): JSX.Element {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to='/' className={styles.logo}>
          OZON Sandbox
        </Link>
        <nav className={styles.nav} aria-label='Основная навигация'>
          <NavLink to='/' end>
            Продавцы
          </NavLink>
          <NavLink to='/coverage' end>
            Покрытие API
          </NavLink>
          <a href='/api/docs' target='_blank' rel='noreferrer' className={styles.navLink}>
            Swagger
          </a>
        </nav>
        <IconButton
          className={styles.themeToggle}
          ariaLabel={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-pressed={theme === 'dark'}
          onClick={toggleTheme}
          icon={theme === 'light' ? MoonIcon : SunIcon}
        />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
