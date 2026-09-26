import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './OverviewTab.module.scss'

import { formatDate, hasPastValue } from '@/shared/lib/index.js'
import type { CabinetSummary } from '@/shared/model/index.js'
import { Badge, Chip } from '@/shared/ui/feedback/index.js'
import { Card, Section } from '@/shared/ui/layout/index.js'

interface OverviewTabProps {
  cabinet: CabinetSummary
}

export function OverviewTab ({ cabinet }: OverviewTabProps): JSX.Element {
  const { seller_info: sellerInfo, roles } = cabinet
  const { company, ratings, subscription } = sellerInfo

  return (
    <div className={styles.overview}>
      <Section title='Компания'>
        <div className={styles.grid}>
          <Field label='Название' value={company.name} />
          <Field label='Юридическое название' value={company.legal_name} />
          <Field label='ИНН' value={company.inn} mono />
          <Field label='ОГРН' value={company.ogrn} mono />
          <Field label='Страна' value={company.country} />
          <Field label='Валюта' value={company.currency} />
          <Field label='Форма собственности' value={company.ownership_form} />
          <Field label='Система налогообложения' value={company.tax_system} />
        </div>
      </Section>

      <Section title='Подписка'>
        <div className={styles.subscriptionGrid}>
          <Field label='Тип' value={subscription.type} />
          <Field label='Премиум-доступ' value={subscription.is_premium ? 'Да' : 'Нет'} />
        </div>
      </Section>

      <Section title='Рейтинги'>
        {ratings.length === 0
          ? <p className={styles.empty}>Нет данных о рейтингах</p>
          : (
              <div className={styles.ratingsGrid}>
                {ratings.map((rating) => (
                  <Card key={rating.name} title={rating.name}>
                    <div className={styles.ratingBody}>
                      <div className={styles.ratingMain}>
                        <span className={styles.ratingValue}>{rating.rating}</span>
                        <Badge
                          variant={getRatingVariant(rating.status)}
                          size='sm'
                        >
                          {rating.status}
                        </Badge>
                      </div>
                      <div className={styles.ratingValues}>
                        <div className={styles.ratingField}>
                          <span className={styles.ratingLabel}>Текущее</span>
                          <span className={styles.ratingData}>{rating.current_value.formatted}</span>
                          <span className={styles.ratingDate}>
                            {formatDate(rating.current_value.date_from)} — {formatDate(rating.current_value.date_to)}
                          </span>
                        </div>
                        {hasPastValue(rating) && (
                          <div className={styles.ratingField}>
                            <span className={styles.ratingLabel}>Прошлое</span>
                            <span className={styles.ratingData}>{rating.past_value.formatted}</span>
                            <span className={styles.ratingDate}>
                              {formatDate(rating.past_value.date_from)} — {formatDate(rating.past_value.date_to)}
                            </span>
                          </div>
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
        {roles.roles.length === 0
          ? <p className={styles.empty}>Роли не настроены</p>
          : (
              <div className={styles.rolesList}>
                {roles.roles.map((role) => (
                  <Card key={role.name} title={role.name}>
                    <div className={styles.methods}>
                      {role.methods.length === 0
                        ? <span className={styles.noMethods}>Нет методов</span>
                        : role.methods.map((method) => (
                            <Chip key={method}>{method}</Chip>
                          ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
      </Section>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  mono?: boolean
}

function Field ({ label, value, mono = false }: FieldProps): JSX.Element {
  const isEmpty = value.trim() === ''
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={clsx(styles.fieldValue, mono && styles.mono, isEmpty && styles.fieldValueEmpty)}>
        {isEmpty ? '—' : value}
      </span>
    </div>
  )
}

function getRatingVariant (status: string): 'green' | 'red' | 'orange' | 'default' {
  if (status === 'OK') return 'green'
  if (status === 'CRITICAL') return 'red'
  if (status === 'WARNING') return 'orange'
  return 'default'
}
