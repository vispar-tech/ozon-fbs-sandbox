import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatCellValue (value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

export function formatDate (value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    return '—'
  }
  const date = parseISO(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return format(date, 'd MMM yyyy', { locale: ru })
}
