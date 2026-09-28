import type { JSX } from 'react'

import styles from './FixturesTab.module.scss'
import { RolesEditor } from './RolesEditor.js'
import { SellerInfoEditor } from './SellerInfoEditor.js'

import type { CabinetSummary } from '@/shared/model/index.js'

interface FixturesTabProps {
  cabinet: CabinetSummary
  onUpdated: () => void
}

export function FixturesTab({ cabinet, onUpdated }: FixturesTabProps): JSX.Element {
  return (
    <div className={styles.fixtures}>
      <SellerInfoEditor cabinet={cabinet} onUpdated={onUpdated} />
      <RolesEditor cabinet={cabinet} onUpdated={onUpdated} />
    </div>
  )
}
