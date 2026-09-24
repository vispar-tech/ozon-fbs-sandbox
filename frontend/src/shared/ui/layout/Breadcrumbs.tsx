import clsx from 'clsx'
import type { JSX, ReactNode } from 'react'

import styles from './Breadcrumbs.module.scss'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  className?: string
  renderLink?: (item: BreadcrumbItem, linkClassName: string) => ReactNode
}

export function Breadcrumbs ({
  items,
  separator = '/',
  className = '',
  renderLink
}: BreadcrumbsProps): JSX.Element {
  return (
    <nav aria-label='Breadcrumb' className={clsx(styles.breadcrumbs, className)}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${index}-${item.label}`} className={styles.item}>
              {isLast ? (
                <span className={styles.current} aria-current='page'>
                  {item.label}
                </span>
              ) : item.href === undefined ? (
                <span className={styles.text}>{item.label}</span>
              ) : renderLink === undefined ? (
                <a className={styles.link} href={item.href}>
                  {item.label}
                </a>
              ) : (
                renderLink(item, styles.link)
              )}
              {!isLast && (
                <span className={styles.separator} aria-hidden='true'>
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}