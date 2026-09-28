import type { JSX } from 'react'

import styles from './CoverageSummary.module.scss'

import { formatDate } from '@/shared/lib/index.js'
import type { OzonCoverage } from '@/shared/model/coverage.js'
import { Meter } from '@/shared/ui/data/index.js'
import { Badge } from '@/shared/ui/feedback/index.js'
import { Card } from '@/shared/ui/layout/index.js'

interface CoverageSummaryProps {
  coverage: OzonCoverage
}

export function CoverageSummary ({ coverage }: CoverageSummaryProps): JSX.Element {
  const remaining = coverage.total - coverage.implemented_total

  return (
    <Card>
        <div className={styles.top}>
          <p className={styles.count}>
            <span className={styles.countValue}>{coverage.implemented_total}</span>
            <span className={styles.countTotal}>из {coverage.total}</span>
          </p>
          <div className={styles.meta}>
            <p className={styles.label}>методов реализовано в песочнице</p>
            <p className={styles.pending}>
              не реализовано <span className={styles.pendingValue}>{remaining}</span> методов
            </p>
          </div>
          <p className={styles.source}>
            Обновлено {formatDate(coverage.source.fetched_at)} ·{' '}
            <a href={coverage.source.url} target='_blank' rel='noreferrer'>исходная схема</a>
          </p>
        </div>
        <div className={styles.groups}>
          {coverage.groups.map((group) => (
            <div key={group.name} className={styles.groupRow}>
              <span className={styles.groupName}>{group.name}</span>
              <Meter
                value={group.implemented_total}
                max={group.total}
                label={group.name}
                className={styles.meterSlot ?? ''}
              />
              <Badge variant={group.implemented_total > 0 ? 'green' : 'default'} size='sm'>
                {group.implemented_total} из {group.total}
              </Badge>
            </div>
          ))}
        </div>

    </Card>
  )
}
