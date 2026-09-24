import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './Pagination.module.scss'

import { Icon } from '@/shared/ui/actions/index.js'

interface PaginationProps {
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  total?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
}

export function Pagination ({
  page,
  pageSize,
  onPageChange,
  total,
  pageSizeOptions,
  onPageSizeChange
}: PaginationProps): JSX.Element {
  const totalPages = total === undefined ? undefined : Math.max(1, Math.ceil(total / pageSize))
  const displayPage = totalPages === undefined ? Math.max(page, 1) : Math.min(Math.max(page, 1), totalPages)

  return (
    <nav className={styles.pagination} aria-label='Пагинация'>
      <button
        type='button'
        className={styles.pageButton}
        disabled={displayPage <= 1}
        aria-label='Предыдущая страница'
        onClick={() => { onPageChange(displayPage - 1) }}
      >
        <Icon icon={ChevronLeftIcon} size='sm' />
      </button>
      {totalPages !== undefined && getPageItems(displayPage, totalPages).map((item, index) => (
        item === 'ellipsis'
          ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>…</span>
            )
          : (
            <button
              key={item}
              type='button'
              className={clsx(styles.pageButton, item === displayPage && styles.pageButtonActive)}
              aria-current={item === displayPage ? 'page' : undefined}
              onClick={() => { onPageChange(item) }}
            >
              {item}
            </button>
            )
      ))}
      <button
        type='button'
        className={styles.pageButton}
        disabled={totalPages !== undefined && displayPage >= totalPages}
        aria-label='Следующая страница'
        onClick={() => { onPageChange(displayPage + 1) }}
      >
        <Icon icon={ChevronRightIcon} size='sm' />
      </button>
      {pageSizeOptions !== undefined && onPageSizeChange !== undefined && (
        <select
          className={styles.pageSizeSelect}
          aria-label='Размер страницы'
          value={pageSize}
          onChange={(event) => { onPageSizeChange(Number(event.target.value)) }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      )}
    </nav>
  )
}

function getPageItems (page: number, totalPages: number): Array<number | 'ellipsis'> {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1])
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const items: Array<number | 'ellipsis'> = []
  let previous = 0
  for (const p of sorted) {
    if (p - previous > 1) {
      items.push('ellipsis')
    }
    items.push(p)
    previous = p
  }
  return items
}