import clsx from 'clsx'
import { type JSX, type KeyboardEvent, type ReactNode, useRef, useState } from 'react'

import styles from './Tabs.module.scss'

const INACTIVE_TAB_INDEX = -1
const INITIAL_INDEX = 0
const PREV_STEP = -1
const NEXT_STEP = 1

interface Tab {
  key: string
  label: string
  count?: number
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultActive?: string
  activeKey?: string
  onChange?: (key: string) => void
  children: ReactNode
  className?: string
}

export function Tabs ({
  tabs,
  defaultActive,
  activeKey,
  onChange,
  children,
  className = ''
}: TabsProps): JSX.Element {
  const firstTabKey = tabs[INITIAL_INDEX]?.key ?? ''
  const [internalActive, setInternalActive] = useState(defaultActive ?? firstTabKey)
  const currentKey = activeKey ?? internalActive
  // Panels mount on first activation and stay mounted afterwards (panel state survives
  // switching). Visited keys are adjusted during render, not in an effect, so a panel
  // never paints empty for a frame.
  const [visitedKeys, setVisitedKeys] = useState<ReadonlySet<string>>(() => new Set([currentKey]))
  const tablistRef = useRef<HTMLDivElement>(null)

  if (!visitedKeys.has(currentKey)) {
    setVisitedKeys(new Set(visitedKeys).add(currentKey))
  }

  const handleChange = (key: string): void => {
    onChange?.(key)
    if (activeKey === undefined) {
      setInternalActive(key)
    }
  }

  const enabledTabs = tabs.filter((t) => t.disabled !== true)
  const panels = Array.isArray(children) ? children : [children]

  function handleTablistKeyDown (event: KeyboardEvent<HTMLDivElement>): void {
    if (!isArrowKey(event.key) && event.key !== 'Home' && event.key !== 'End') {
      return
    }
    event.preventDefault()
    if (enabledTabs.length === 0) {
      return
    }
    const nextKey = resolveNextKey(event.key, enabledTabs, currentKey)
    handleChange(nextKey)
    const tabButton = tablistRef.current?.querySelector<HTMLButtonElement>(`[data-tab-key="${nextKey}"]`)
    tabButton?.focus()
  }

  return (
    <div className={clsx(styles.tabs, className)}>
      <div ref={tablistRef} className={styles.tabsList} role='tablist' onKeyDown={handleTablistKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            data-tab-key={tab.key}
            className={clsx(styles.tab, tab.key === currentKey && styles.tabActive)}
            role='tab'
            aria-selected={tab.key === currentKey}
            aria-disabled={tab.disabled === true ? true : undefined}
            tabIndex={tab.key === currentKey ? 0 : INACTIVE_TAB_INDEX}
            disabled={tab.disabled}
            onClick={() => { handleChange(tab.key) }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={styles.tabCount}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      <div className={styles.tabsPanels}>
        {tabs.map((tab, idx) => {
          const { [idx]: panel } = panels
          if (panel === undefined) {
            return null
          }
          return (
            <div
              key={tab.key}
              role='tabpanel'
              hidden={tab.key !== currentKey}
              tabIndex={tab.key === currentKey ? 0 : INACTIVE_TAB_INDEX}
            >
              {visitedKeys.has(tab.key) && panel}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function isArrowKey (key: string): boolean {
  return key === 'ArrowLeft' || key === 'ArrowRight'
}

function resolveNextKey (direction: string, enabledTabs: Tab[], currentKey: string): string {
  if (direction === 'Home') return enabledTabs[INITIAL_INDEX]?.key ?? currentKey
  if (direction === 'End') return enabledTabs[enabledTabs.length - 1]?.key ?? currentKey
  const step = direction === 'ArrowRight' ? NEXT_STEP : PREV_STEP
  return cycleTab(enabledTabs, currentKey, step)
}

function cycleTab (enabledTabs: Tab[], currentKey: string, step: number): string {
  const currentIdx = enabledTabs.findIndex((t) => t.key === currentKey)
  const base = currentIdx === INACTIVE_TAB_INDEX ? INITIAL_INDEX : currentIdx
  const idx = (base + step + enabledTabs.length) % enabledTabs.length
  return enabledTabs[idx]?.key ?? currentKey
}
