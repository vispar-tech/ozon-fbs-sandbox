import { MapIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'

import { collectNodeKeys, countMethods, type CoverageFilter, filterCoverage, isFilterActive } from './CoverageHelpers.js'
import styles from './CoveragePage.module.scss'
import { CoverageSummary } from './CoverageSummary.js'
import { CoverageTree } from './CoverageTree.js'

import { getOzonCoverage } from '@/shared/api/index.js'
import { errorMessageOr } from '@/shared/lib/index.js'
import type { OzonCoverage } from '@/shared/model/coverage.js'
import { Button, SearchInput } from '@/shared/ui/actions/index.js'
import { Badge, CenteredStatus, EmptyState } from '@/shared/ui/feedback/index.js'
import { Toggle } from '@/shared/ui/inputs/index.js'
import { Card } from '@/shared/ui/layout/index.js'

const NO_FILTER: CoverageFilter = { text: '', pendingOnly: false }

type CoverageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; coverage: OzonCoverage }

export function CoveragePage (): JSX.Element {
  const [state, setState] = useState<CoverageState>({ status: 'loading' })
  const [filter, setFilter] = useState<CoverageFilter>(NO_FILTER)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const loadCoverage = useCallback(async (): Promise<void> => {
    setState({ status: 'loading' })
    try {
      const coverage = await getOzonCoverage()
      setState({ status: 'ready', coverage })
    } catch (error) {
      setState({ status: 'error', message: errorMessageOr(error, 'Не удалось загрузить покрытие Ozon Seller API') })
    }
  }, [])

  useEffect(() => {
    void loadCoverage()
  }, [loadCoverage])

  if (state.status === 'loading') {
    return <CenteredStatus status='loading' label='Загрузка покрытия' />
  }

  if (state.status === 'error') {
    return (
      <CenteredStatus
        status='error'
        title='Не удалось загрузить покрытие'
        message={state.message}
        onRetry={() => { void loadCoverage() }}
      />
    )
  }

  const { coverage } = state

  if (coverage.groups.length === 0) {
    return (
      <CenteredStatus status='empty'>
        <EmptyState
          icon={<MapIcon />}
          title='Покрытие не найдено'
          description='Схема Ozon не содержит методов — обновите данные или проверьте источник.'
          action={<Button onClick={() => { void loadCoverage() }}>Повторить</Button>}
        />
      </CenteredStatus>
    )
  }

  const active = isFilterActive(filter)
  const searchActive = filter.text.trim() !== ''
  const shown = filterCoverage(coverage.groups, filter)
  const shownCount = countMethods(shown)

  function handleReset (): void {
    setFilter(NO_FILTER)
  }

  function handleToggleNode (key: string, currentlyOpen: boolean): void {
    setExpanded((previous) => ({ ...previous, [key]: !currentlyOpen }))
  }

  function handleExpandAll (open: boolean): void {
    setExpanded((previous) => {
      const next = { ...previous }
      for (const key of collectNodeKeys(shown)) {
        next[key] = open
      }
      return next
    })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Покрытие Ozon Seller API</h1>

      <CoverageSummary coverage={coverage} />

      <section aria-label='Поиск и фильтры'>
        <Card>
          <div className={styles.controls}>
            <div className={styles.controlsRow}>
              <div className={styles.search}>
                <SearchInput
                  label='Поиск'
                  placeholder='Путь, название или тег'
                  value={filter.text}
                  onChange={(event) => { setFilter((previous) => ({ ...previous, text: event.target.value })) }}
                  onClear={() => { setFilter((previous) => ({ ...previous, text: '' })) }}
                />
              </div>
              <Toggle
                checked={filter.pendingOnly}
                onChange={(checked) => { setFilter((previous) => ({ ...previous, pendingOnly: checked })) }}
                label='Только нереализованные'
              />
            </div>
            <div className={styles.meta}>
              <span className={styles.legend}>
                <Badge variant='green' dot>Реализовано</Badge>
                <Badge dot>Не реализовано</Badge>
              </span>
              {active && (
                <span className={styles.results}>
                  Показано <strong className={styles.resultsCount}>{shownCount}</strong> из {coverage.total} методов
                  <Button variant='link' size='sm' onClick={handleReset}>Сбросить фильтры</Button>
                </span>
              )}
              <span className={styles.expandActions}>
                <Button variant='ghost' size='sm' onClick={() => { handleExpandAll(true) }}>Раскрыть всё</Button>
                <Button variant='ghost' size='sm' onClick={() => { handleExpandAll(false) }}>Свернуть всё</Button>
              </span>
            </div>
          </div>
        </Card>
      </section>

      {shown.length === 0
        ? (
            <EmptyState
              icon={<MapIcon />}
              title='Ничего не найдено'
              description='Под запрос или фильтры не попал ни один метод.'
              action={<Button variant='secondary' onClick={handleReset}>Сбросить фильтры</Button>}
            />
          )
        : (
            <CoverageTree
              groups={shown}
              expanded={expanded}
              defaultOpen={searchActive}
              onToggle={handleToggleNode}
            />
          )}
    </div>
  )
}
