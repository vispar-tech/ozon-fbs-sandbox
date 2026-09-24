import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { type JSX, type ReactNode, useMemo, useState } from 'react'

import styles from './Table.module.scss'

import { formatCellValue } from '@/shared/lib/index.js'
import { Icon } from '@/shared/ui/actions/index.js'
import { Checkbox } from '@/shared/ui/inputs/Checkbox.js'

type SortDirection = 'asc' | 'desc' | 'none'

interface SortState {
  key: string | null
  direction: SortDirection
}

export interface SortTitleContext {
  sortIcon?: ReactNode
}

export interface Column<T> {
  key: string
  title: string
  width?: string
  sortable?: boolean
  align?: 'start' | 'end'
  renderCell?: (value: unknown, row: T, index: number) => ReactNode
  renderTitle?: (ctx: SortTitleContext) => ReactNode
}

interface TableProps<T> {
  columns: Array<Column<T>>
  data: T[]
  rowKey: (row: T, index: number) => string
  compact?: boolean
  emptyMessage?: string
  className?: string
  sticky?: boolean
  // Enables sticky header: the wrap becomes a vertical scroll container
  // (sticky sticks to the wrap's scrollport, not the viewport).
  maxHeight?: string
  selectable?: boolean
  // Emitted keys may include rows no longer present in `data`
  // (selection survives data changes; parent should reconcile).
  onSelectionChange?: (selectedKeys: string[]) => void
  rowDisabled?: (row: T) => boolean
  onSortChange?: (key: string | null, direction: SortDirection) => void
}

export function Table<T> ({
  columns,
  data,
  rowKey,
  compact = false,
  emptyMessage = 'No data',
  className = '',
  sticky = false,
  maxHeight,
  selectable = false,
  onSelectionChange,
  rowDisabled,
  onSortChange
}: TableProps<T>): JSX.Element {
  const [sort, setSort] = useState<SortState>({ key: null, direction: 'none' })
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())

  const sortedData = useMemo(() => {
    const { key: sortKey } = sort
    if (sortKey === null) {
      return data
    }
    const column = columns.find((col) => col.key === sortKey)
    if (column?.sortable !== true) {
      return data
    }
    return [...data].sort((a, b) => {
      const result = compareValues((a as Record<string, unknown>)[sortKey], (b as Record<string, unknown>)[sortKey]) // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion -- generic row access requires index-signature cast
      return sort.direction === 'asc' ? result : -result
    })
  }, [data, sort, columns])

  const selectableKeys = useMemo(
    () => getSelectableKeys(data, rowKey, rowDisabled),
    [data, rowKey, rowDisabled]
  )

  const { length: selectedCount } = selectableKeys.filter((key) => selectedKeys.has(key))
  const allSelected = selectableKeys.length > 0 && selectedCount === selectableKeys.length
  const someSelected = selectedCount > 0 && !allSelected

  function handleSort (colKey: string): void {
    const next = getNextSort(sort, colKey)
    setSort(next)
    onSortChange?.(next.key, next.direction)
  }

  function handleRowToggle (key: string): void {
    const next = toggleKey(selectedKeys, key)
    setSelectedKeys(next)
    onSelectionChange?.(Array.from(next))
  }

  function handleSelectAll (): void {
    const next = toggleAll(selectedKeys, selectableKeys, allSelected)
    setSelectedKeys(next)
    onSelectionChange?.(Array.from(next))
  }

  const tableClasses = buildTableClasses(compact, sticky)
  const wrapClasses = buildWrapClasses(sticky, className)
  const wrapStyle = buildWrapStyle(sticky, maxHeight)
  const colSpan = columns.length + (selectable ? 1 : 0)

  return (
    <div className={wrapClasses} style={wrapStyle}>
      <table className={tableClasses}>
        <TableHeader
          columns={columns}
          selectable={selectable}
          sort={sort}
          allSelected={allSelected}
          someSelected={someSelected}
          selectableCount={selectableKeys.length}
          onSelectAll={handleSelectAll}
          onSort={handleSort}
        />
        <TableBody
          columns={columns}
          data={sortedData}
          selectable={selectable}
          selectedKeys={selectedKeys}
          rowKey={rowKey}
          rowDisabled={rowDisabled}
          emptyMessage={emptyMessage}
          colSpan={colSpan}
          onRowToggle={handleRowToggle}
        />
      </table>
    </div>
  )
}

interface TableHeaderProps<T> {
  columns: Array<Column<T>>
  selectable: boolean
  sort: SortState
  allSelected: boolean
  someSelected: boolean
  selectableCount: number
  onSelectAll: () => void
  onSort: (key: string) => void
}

function TableHeader<T> ({
  columns,
  selectable,
  sort,
  allSelected,
  someSelected,
  selectableCount,
  onSelectAll,
  onSort
}: TableHeaderProps<T>): JSX.Element {
  return (
    <thead>
      <tr>
        {selectable && (
          <th className={styles.checkboxCell}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              disabled={selectableCount === 0}
              ariaLabel='Select all rows'
              onChange={onSelectAll}
            />
          </th>
        )}
        {columns.map((col) => {
          const isSorted = sort.key === col.key
          const ariaSort = col.sortable === true
            ? (isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none')
            : undefined
          return (
            <th
              key={col.key}
              style={col.width === undefined && col.align === undefined
                ? undefined
                : { width: col.width, textAlign: col.align }}
              aria-sort={ariaSort}
            >
              <HeaderTitle col={col} isSorted={isSorted} sort={sort} onSort={onSort} />
            </th>
          )
        })}
      </tr>
    </thead>
  )
}

interface HeaderTitleProps<T> {
  col: Column<T>
  isSorted: boolean
  sort: SortState
  onSort: (key: string) => void
}

function HeaderTitle<T> ({
  col,
  isSorted,
  sort,
  onSort
}: HeaderTitleProps<T>): ReactNode {
  if (col.sortable !== true) {
    return col.renderTitle === undefined ? col.title : col.renderTitle({ sortIcon: undefined })
  }
  const sortIcon = <SortIcon direction={isSorted ? sort.direction : 'none'} />
  return (
    <button type='button' className={styles.sortButton} onClick={() => { onSort(col.key) }}>
      {col.renderTitle === undefined ? col.title : col.renderTitle({ sortIcon })}
      {col.renderTitle === undefined && sortIcon}
    </button>
  )
}

interface TableBodyProps<T> {
  columns: Array<Column<T>>
  data: T[]
  selectable: boolean
  selectedKeys: Set<string>
  rowKey: (row: T, index: number) => string
  rowDisabled?: (row: T) => boolean
  emptyMessage: string
  colSpan: number
  onRowToggle: (key: string) => void
}

function TableBody<T> ({
  columns,
  data,
  selectable,
  selectedKeys,
  rowKey,
  rowDisabled,
  emptyMessage,
  colSpan,
  onRowToggle
}: TableBodyProps<T>): JSX.Element {
  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className={styles.emptyCell}>
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    )
  }
  return (
    <tbody>
      {data.map((row, idx) => {
        const key = rowKey(row, idx)
        const isDisabled = rowDisabled?.(row) ?? false
        return (
          <tr key={key}>
            {selectable && (
              <td className={styles.checkboxCell}>
                <Checkbox
                  checked={selectedKeys.has(key)}
                  disabled={isDisabled}
                  ariaLabel={`Select row ${key}`}
                  onChange={() => { onRowToggle(key) }}
                />
              </td>
            )}
            {columns.map((col) => (
              <td key={col.key} style={col.align === undefined ? undefined : { textAlign: col.align }}>
                {col.renderCell === undefined
                  ? formatCellValue((row as Record<string, unknown>)[col.key]) // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion -- generic row access requires index-signature cast
                  : col.renderCell((row as Record<string, unknown>)[col.key], row, idx) // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion -- generic row access requires index-signature cast
                }
              </td>
            ))}
          </tr>
        )
      })}
    </tbody>
  )
}

function getNextSort (current: SortState, colKey: string): SortState {
  if (current.key !== colKey) {
    return { key: colKey, direction: 'asc' }
  }
  if (current.direction === 'asc') {
    return { key: colKey, direction: 'desc' }
  }
  if (current.direction === 'desc') {
    return { key: null, direction: 'none' }
  }
  return { key: colKey, direction: 'asc' }
}

function compareValues (a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  const aStr = toComparableString(a)
  const bStr = toComparableString(b)
  if (aStr === bStr) return 0
  if (aStr === null) return 1
  if (bStr === null) return 1
  return aStr.localeCompare(bStr)
}

function toComparableString (value: unknown): string | null {
  if (value === null || value === undefined || typeof value === 'object') return null
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'string') return value
  return null
}

function getSelectableKeys<T> (
  data: T[],
  rowKey: (row: T, index: number) => string,
  rowDisabled: ((row: T) => boolean) | undefined
): string[] {
  return data
    .map((row, index) => ({ key: rowKey(row, index), disabled: rowDisabled?.(row) ?? false }))
    .filter((entry) => !entry.disabled)
    .map((entry) => entry.key)
}

function toggleKey (keys: Set<string>, key: string): Set<string> {
  const next = new Set(keys)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  return next
}

function toggleAll (keys: Set<string>, selectableKeys: string[], allSelected: boolean): Set<string> {
  const next = new Set(keys)
  if (allSelected) {
    next.clear()
  } else {
    for (const key of selectableKeys) {
      next.add(key)
    }
  }
  return next
}

function buildTableClasses (compact: boolean, sticky: boolean): string {
  return clsx(styles.table, compact && styles.tableCompact, sticky && styles.tableSticky)
}

function buildWrapClasses (sticky: boolean, className: string): string {
  return clsx(styles.wrap, sticky && styles.wrapSticky, className)
}

function buildWrapStyle (sticky: boolean, maxHeight: string | undefined): { maxHeight: string } | undefined {
  return sticky && maxHeight !== undefined ? { maxHeight } : undefined
}

function SortIcon ({ direction }: { direction: SortDirection }): JSX.Element {
  const Chevron = direction === 'desc' ? ChevronDownIcon : ChevronUpIcon
  return (
    <Icon
      icon={Chevron}
      size='xs'
      className={clsx(
        styles.sortIcon,
        direction === 'asc' && styles.sortIconAsc,
        direction === 'desc' && styles.sortIconDesc,
        direction === 'none' && styles.sortIconNone
      )}
    />
  )
}