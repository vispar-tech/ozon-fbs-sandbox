import type { JSX } from 'react'

import styles from './OverviewTab.module.scss'
import { hasPastValue } from './sellerRating.js'

import { formatDate } from '@/shared/lib/index.js'
import type { CabinetSummary } from '@/shared/model/index.js'
import { DataField } from '@/shared/ui/data/index.js'
import { Badge, Chip, EmptyState } from '@/shared/ui/feedback/index.js'
import { Card, Section } from '@/shared/ui/layout/index.js'

interface OverviewTabProps {
  cabinet: CabinetSummary
}

export function OverviewTab({ cabinet }: OverviewTabProps): JSX.Element {
  const { seller_info: sellerInfo, roles } = cabinet
  const { company, ratings, subscription } = sellerInfo

  return (
    <div className={styles.overview}>
      <Section title='Компания'>
        <div className={styles.grid}>
          <DataField label='Название' value={company.name} />
          <DataField label='Юридическое название' value={company.legal_name} />
          <DataField label='ИНН' value={company.inn} mono />
          <DataField label='ОГРН' value={company.ogrn} mono />
          <DataField label='Страна' value={company.country} />
          <DataField label='Валюта' value={company.currency} />
          <DataField label='Форма собственности' value={company.ownership_form} />
          <DataField label='Система налогообложения' value={company.tax_system} />
        </div>
      </Section>

      <Section title='Подписка'>
        <div className={styles.grid}>
          <DataField label='Тип' value={subscription.type} />
          <DataField label='Премиум-доступ' value={subscription.is_premium ? 'Да' : 'Нет'} />
        </div>
      </Section>

      <Section title='Рейтинги'>
        {ratings.length === 0 ? (
          <EmptyState title='Нет данных о рейтингах' />
        ) : (
          <div className={styles.ratingsGrid}>
            {ratings.map((rating) => (
              <Card key={rating.name} title={rating.name}>
                <div className={styles.stack}>
                  <div className={styles.row}>
                    <span className={styles.ratingValue}>{rating.rating}</span>
                    <Badge variant={getRatingVariant(rating.status)} size='sm'>
                      {rating.status}
                    </Badge>
                  </div>
                  <div className={styles.ratingValues}>
                    <DataField
                      label='Текущее'
                      value={rating.current_value.formatted}
                      note={`${formatDate(rating.current_value.date_from)} — ${formatDate(rating.current_value.date_to)}`}
                    />
                    {hasPastValue(rating) && (
                      <DataField
                        label='Прошлое'
                        value={rating.past_value.formatted}
                        note={`${formatDate(rating.past_value.date_from)} — ${formatDate(rating.past_value.date_to)}`}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section
        title='Роли'
        actions={
          <span className={styles.expiresAt}>
            Срок действия ключа: <code>{formatDate(roles.expires_at)}</code>
          </span>
        }
      >
        {roles.roles.length === 0 ? (
          <EmptyState title='Роли не настроены' />
        ) : (
          <div className={styles.stack}>
            {roles.roles.map((role) => (
              <Card key={role.name} title={role.name}>
                <div className={styles.row}>
                  {role.methods.length === 0 ? (
                    <span className={styles.noMethods}>Нет методов</span>
                  ) : (
                    role.methods.map((method) => <Chip key={method}>{method}</Chip>)
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function getRatingVariant(status: string): 'green' | 'red' | 'orange' | 'default' {
  if (status === 'OK') return 'green'
  if (status === 'CRITICAL') return 'red'
  if (status === 'WARNING') return 'orange'
  return 'default'
}
