import { PlusIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'
import { useState } from 'react'

import styles from './FixturesTab.module.scss'

import { updateCabinet } from '@/shared/api/index.js'
import { buildFormSchema, type FieldDefinition, FieldRenderer, useAutoForm } from '@/shared/hooks/index.js'
import type { CabinetSummary, Rating, Roles, SellerInfo } from '@/shared/model/index.js'
import { Button, Icon } from '@/shared/ui/actions/index.js'
import { Chip, ErrorBanner, useToast } from '@/shared/ui/feedback/index.js'
import { Input, Select, Toggle } from '@/shared/ui/inputs/index.js'
import { Card, Section } from '@/shared/ui/layout/index.js'

const CURRENCY_OPTIONS = [
  { value: 'RUB', label: 'RUB' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'CNY', label: 'CNY' },
  { value: 'BYN', label: 'BYN' },
  { value: 'KZT', label: 'KZT' },
  { value: 'KGS', label: 'KGS' }
]

const OWNERSHIP_FORM_OPTIONS = [
  { value: 'ООО', label: 'ООО' },
  { value: 'ИП', label: 'ИП' },
  { value: 'АО', label: 'АО' },
  { value: 'ПАО', label: 'ПАО' },
  { value: 'ЗАО', label: 'ЗАО' },
  { value: 'ОАО', label: 'ОАО' },
  { value: 'НКО', label: 'НКО' }
]

const TAX_SYSTEM_OPTIONS = [
  { value: 'UNKNOWN', label: 'Не указана' },
  { value: 'UNSPECIFIED', label: 'Не выбрана' },
  { value: 'OSNO', label: 'ОСНО' },
  { value: 'USN', label: 'УСН' },
  { value: 'NPD', label: 'НПД' },
  { value: 'AUSN', label: 'АУСН' },
  { value: 'PSN', label: 'ПСН' }
]

const SUBSCRIPTION_TYPE_OPTIONS = [
  { value: 'UNKNOWN', label: 'Неизвестна' },
  { value: 'UNSPECIFIED', label: 'Не указана' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PREMIUM_LITE', label: 'Premium Lite' },
  { value: 'PREMIUM_PLUS', label: 'Premium Plus' },
  { value: 'PREMIUM_PRO', label: 'Premium Pro' }
]

const RATING_STATUS_OPTIONS = [
  { value: 'UNKNOWN', label: 'Неизвестен' },
  { value: 'OK', label: 'OK' },
  { value: 'WARNING', label: 'Предупреждение' },
  { value: 'CRITICAL', label: 'Критический' }
]

const RATING_VALUE_TYPE_OPTIONS = [
  { value: 'UNKNOWN', label: 'Неизвестен' },
  { value: 'INDEX', label: 'Индекс' },
  { value: 'PERCENT', label: 'Процент' },
  { value: 'TIME', label: 'Время' },
  { value: 'RATIO', label: 'Соотношение' },
  { value: 'REVIEW_SCORE', label: 'Оценка отзывов' },
  { value: 'COUNT', label: 'Количество' }
]

const SELLER_INFO_FIELDS: FieldDefinition[] = [
  { name: 'company.name', label: 'Название' },
  { name: 'company.legal_name', label: 'Юридическое название' },
  { name: 'company.inn', label: 'ИНН' },
  { name: 'company.ogrn', label: 'ОГРН' },
  { name: 'company.country', label: 'Страна' },
  { name: 'company.currency', type: 'select', label: 'Валюта', options: CURRENCY_OPTIONS },
  { name: 'company.ownership_form', type: 'select', label: 'Форма собственности', options: OWNERSHIP_FORM_OPTIONS },
  { name: 'company.tax_system', type: 'select', label: 'Система налогообложения', options: TAX_SYSTEM_OPTIONS },
  { name: 'subscription.type', type: 'select', label: 'Тип подписки', options: SUBSCRIPTION_TYPE_OPTIONS },
  { name: 'subscription.is_premium', type: 'toggle', label: 'Премиум-доступ' }
]

const ROLES_FIELDS: FieldDefinition[] = [{ name: 'expires_at', label: 'Срок действия ключа' }]

const SELLER_INFO_SCHEMA = buildFormSchema(SELLER_INFO_FIELDS)
const ROLES_SCHEMA = buildFormSchema(ROLES_FIELDS)

interface FixturesTabProps {
  cabinet: CabinetSummary
  onUpdated: () => void
}

interface EditorProps {
  cabinet: CabinetSummary
  onUpdated: () => void
}

interface SellerInfoFormValues extends Record<string, unknown> {
  'company.name': string
  'company.legal_name': string
  'company.inn': string
  'company.ogrn': string
  'company.country': string
  'company.currency': string
  'company.ownership_form': string
  'company.tax_system': string
  'subscription.type': string
  'subscription.is_premium': boolean
  ratings: Rating[]
}

interface RolesFormValues extends Record<string, unknown> {
  expires_at: string
  roles: Roles['roles']
}

export function FixturesTab ({ cabinet, onUpdated }: FixturesTabProps): JSX.Element {
  return (
    <div className={styles.fixtures}>
      <SellerInfoEditor cabinet={cabinet} onUpdated={onUpdated} />
      <RolesEditor cabinet={cabinet} onUpdated={onUpdated} />
    </div>
  )
}

function flattenSellerInfo (fixture: SellerInfo): SellerInfoFormValues {
  return {
    'company.name': fixture.company.name,
    'company.legal_name': fixture.company.legal_name,
    'company.inn': fixture.company.inn,
    'company.ogrn': fixture.company.ogrn,
    'company.country': fixture.company.country,
    'company.currency': fixture.company.currency,
    'company.ownership_form': fixture.company.ownership_form,
    'company.tax_system': fixture.company.tax_system,
    'subscription.type': fixture.subscription.type,
    'subscription.is_premium': fixture.subscription.is_premium,
    ratings: fixture.ratings.map((r) => ({
      ...r,
      current_value: { ...r.current_value },
      past_value: r.past_value === undefined ? undefined : { ...r.past_value }
    }))
  }
}

function buildSellerInfoFixture (data: SellerInfoFormValues): SellerInfo {
  return {
    company: {
      name: data['company.name'],
      legal_name: data['company.legal_name'],
      inn: data['company.inn'],
      ogrn: data['company.ogrn'],
      country: data['company.country'],
      currency: data['company.currency'],
      ownership_form: data['company.ownership_form'],
      tax_system: data['company.tax_system'] as SellerInfo['company']['tax_system'] // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion -- reconstructing from flat form values
    },
    subscription: {
      type: data['subscription.type'] as SellerInfo['subscription']['type'], // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion -- reconstructing from flat form values
      is_premium: data['subscription.is_premium']
    },
    ratings: data.ratings.map((r) => {
      const currentNum = Number(String(r.current_value.value))
      const pastNum = r.past_value === undefined ? undefined : Number(String(r.past_value.value))
      return {
        ...r,
        current_value: { ...r.current_value, value: Number.isNaN(currentNum) ? 0 : currentNum },
        past_value: r.past_value === undefined ? undefined : { ...r.past_value, value: pastNum === undefined || Number.isNaN(pastNum) ? 0 : pastNum }
      }
    })
  }
}

function emptyRating (): Rating {
  return {
    name: '',
    rating: '',
    status: 'UNKNOWN',
    value_type: 'UNKNOWN',
    current_value: { formatted: '', value: 0, date_from: '', date_to: '', status: { danger: false, premium: false, warning: false } }
  }
}

function SellerInfoEditor ({ cabinet, onUpdated }: EditorProps): JSX.Element {
  const { showToast } = useToast()
  const form = useAutoForm<SellerInfoFormValues>({
    fields: SELLER_INFO_FIELDS,
    schema: SELLER_INFO_SCHEMA,
    initialValues: flattenSellerInfo(cabinet.seller_info),
    onSubmit: async (data) => {
      await updateCabinet(cabinet.client_id, { seller_info: buildSellerInfoFixture(data) })
      onUpdated()
      showToast({ tone: 'success', title: 'Информация о продавце обновлена' })
    }
  })
  const ratings: Rating[] = form.values.ratings

  function addRating (): void {
    form.handleChange('ratings', [...ratings, emptyRating()])
  }

  function removeRating (index: number): void {
    form.handleChange('ratings', ratings.filter((_, idx) => idx !== index))
  }

  function updateRating (index: number, field: string, value: unknown): void {
    form.handleChange('ratings', ratings.map((r, idx) => idx === index ? { ...r, [field]: value } : r))
  }

  function updateRatingValue (ratingIndex: number, which: 'current_value' | 'past_value', field: string, value: unknown): void {
    form.handleChange('ratings', ratings.map((r, idx) => {
      if (idx !== ratingIndex) return r
      const target = r[which] // eslint-disable-line @typescript-eslint/prefer-destructuring -- dynamic key access
      if (target === undefined) return r
      return { ...r, [which]: { ...target, [field]: value } }
    }))
  }

  function updateRatingStatusFlag (ratingIndex: number, which: 'current_value' | 'past_value', flag: 'danger' | 'premium' | 'warning', checked: boolean): void {
    form.handleChange('ratings', ratings.map((r, idx) => {
      if (idx !== ratingIndex) return r
      const target = r[which] // eslint-disable-line @typescript-eslint/prefer-destructuring -- dynamic key access
      if (target === undefined) return r
      return { ...r, [which]: { ...target, status: { ...target.status, [flag]: checked } } }
    }))
  }

  function addPastValue (ratingIndex: number): void {
    form.handleChange('ratings', ratings.map((r, idx) => {
      if (idx !== ratingIndex) return r
      return {
        ...r,
        past_value: { formatted: '', value: 0, date_from: '', date_to: '', status: { danger: false, premium: false, warning: false } }
      }
    }))
  }

  function removePastValue (ratingIndex: number): void {
    form.handleChange('ratings', ratings.map((r, idx) => {
      if (idx !== ratingIndex) return r
      const copy = { ...r }
      delete copy.past_value
      return copy
    }))
  }

  return (
    <Section title='Информация о продавце' actions={<Button type='submit' form='seller-info-form' size='sm' loading={form.isSubmitting}>Сохранить</Button>}>
      {form.submitError !== null && (
        <ErrorBanner title='Не удалось обновить' message={form.submitError} />
      )}
      <form id='seller-info-form' onSubmit={form.handleSubmit} noValidate>
        <div className={styles.fields}>
          {SELLER_INFO_FIELDS.map((field) => (
            <FieldRenderer key={field.name} field={field} value={form.values[field.name]} error={form.errors[field.name]} onChange={form.handleChange} />
          ))}
        </div>

        <h3 className={styles.subsectionTitle}>Рейтинги</h3>
        <div className={styles.ratingsList}>
          {ratings.map((rating, ratingIdx) => (
            <Card key={`${ratingIdx}-${rating.name}`} title={`Рейтинг ${ratingIdx + 1}`} headerAction={<Button type='button' variant='danger' size='sm' onClick={() => { removeRating(ratingIdx) }}>Удалить</Button>}>
              <div className={styles.ratingEditorInner}>
                <div className={styles.fields}>
                  <Input label='Название' value={rating.name} onChange={(e) => { updateRating(ratingIdx, 'name', e.target.value) }} />
                  <Input label='Значение' value={rating.rating} onChange={(e) => { updateRating(ratingIdx, 'rating', e.target.value) }} />
                  <Select label='Статус' value={rating.status} onChange={(value) => { updateRating(ratingIdx, 'status', value) }} options={RATING_STATUS_OPTIONS} />
                  <Select label='Тип значения' value={rating.value_type} onChange={(value) => { updateRating(ratingIdx, 'value_type', value) }} options={RATING_VALUE_TYPE_OPTIONS} />
                </div>
                <RatingValueEditor
                  title='Текущее значение'
                  value={rating.current_value}
                  onFieldChange={(field, value) => { updateRatingValue(ratingIdx, 'current_value', field, value) }}
                  onFlagChange={(flag, checked) => { updateRatingStatusFlag(ratingIdx, 'current_value', flag, checked) }}
                />

                {rating.past_value === undefined
                  ? (
                      <Button type='button' variant='secondary' size='sm' icon={<Icon icon={PlusIcon} size='sm' />} onClick={() => { addPastValue(ratingIdx) }}>Добавить прошлое значение</Button>
                    )
                  : (
                      <>
                        <div className={styles.pastValueHeader}>
                          <Button type='button' variant='ghost' size='sm' onClick={() => { removePastValue(ratingIdx) }}>Убрать</Button>
                        </div>
                        <RatingValueEditor
                          title='Прошлое значение'
                          value={rating.past_value}
                          onFieldChange={(field, value) => { updateRatingValue(ratingIdx, 'past_value', field, value) }}
                          onFlagChange={(flag, checked) => { updateRatingStatusFlag(ratingIdx, 'past_value', flag, checked) }}
                        />
                      </>
                    )}
              </div>
            </Card>
        ))}
        <Button type='button' variant='secondary' size='sm' icon={<Icon icon={PlusIcon} size='sm' />} onClick={addRating}>Добавить рейтинг</Button>
        </div>
      </form>
    </Section>
  )
}

interface RatingValueEditorProps {
  title: string
  value: Rating['current_value']
  onFieldChange: (field: string, value: unknown) => void
  onFlagChange: (flag: 'danger' | 'premium' | 'warning', checked: boolean) => void
}

function RatingValueEditor ({ title, value, onFieldChange, onFlagChange }: RatingValueEditorProps): JSX.Element {
  return (
    <>
      <h4 className={styles.ratingValueTitle}>{title}</h4>
      <div className={styles.fields}>
        <Input label='Форматированное' value={value.formatted} onChange={(e) => { onFieldChange('formatted', e.target.value) }} />
        <Input label='Числовое' type='number' value={String(value.value)} onChange={(e) => { onFieldChange('value', e.target.value) }} />
        <Input label='Дата начала' value={value.date_from} onChange={(e) => { onFieldChange('date_from', e.target.value) }} />
        <Input label='Дата окончания' value={value.date_to} onChange={(e) => { onFieldChange('date_to', e.target.value) }} />
      </div>
      <div className={styles.flagsRow}>
        <Toggle label='Опасность' checked={value.status.danger ?? false} onChange={(checked) => { onFlagChange('danger', checked) }} />
        <Toggle label='Премиум' checked={value.status.premium ?? false} onChange={(checked) => { onFlagChange('premium', checked) }} />
        <Toggle label='Предупреждение' checked={value.status.warning ?? false} onChange={(checked) => { onFlagChange('warning', checked) }} />
      </div>
    </>
  )
}

function RolesEditor ({ cabinet, onUpdated }: EditorProps): JSX.Element {
  const { showToast } = useToast()
  const form = useAutoForm<RolesFormValues>({
    fields: ROLES_FIELDS,
    schema: ROLES_SCHEMA,
    initialValues: { expires_at: cabinet.roles.expires_at, roles: cabinet.roles.roles },
    onSubmit: async (data) => {
      await updateCabinet(cabinet.client_id, { roles: { expires_at: data.expires_at, roles: data.roles } })
      onUpdated()
      showToast({ tone: 'success', title: 'Фикстура ролей обновлена' })
    }
  })
  const roles: RolesFormValues['roles'] = form.values.roles

  function addRole (): void {
    form.handleChange('roles', [...roles, { name: '', methods: [] }])
  }

  function removeRole (index: number): void {
    form.handleChange('roles', roles.filter((_, idx) => idx !== index))
  }

  function updateRoleName (index: number, name: string): void {
    form.handleChange('roles', roles.map((role, idx) => idx === index ? { ...role, name } : role))
  }

  function addMethod (roleIndex: number, method: string): void {
    if (method.trim() === '') return
    form.handleChange('roles', roles.map((role, idx) =>
      idx === roleIndex ? { ...role, methods: [...role.methods, method.trim()] } : role
    ))
  }

  function removeMethod (roleIndex: number, methodIndex: number): void {
    form.handleChange('roles', roles.map((role, idx) =>
      idx === roleIndex ? { ...role, methods: role.methods.filter((_, mIdx) => mIdx !== methodIndex) } : role
    ))
  }

  return (
    <Section title='Фикстура ролей' actions={<Button type='submit' form='roles-form' size='sm' loading={form.isSubmitting}>Сохранить</Button>}>
      {form.submitError !== null && (
        <ErrorBanner title='Не удалось обновить' message={form.submitError} />
      )}
      <form id='roles-form' onSubmit={form.handleSubmit} noValidate>
        <div className={styles.fields}>
          {ROLES_FIELDS.map((field) => (
            <FieldRenderer key={field.name} field={field} value={form.values[field.name]} error={form.errors[field.name]} onChange={form.handleChange} />
          ))}
        </div>
        <div className={styles.rolesList}>
          {roles.map((role, roleIdx) => (
            <Card key={`${roleIdx}-${role.name}`} title={`Роль ${roleIdx + 1}`} headerAction={<Button type='button' variant='danger' size='sm' onClick={() => { removeRole(roleIdx) }}>Удалить</Button>}>
              <div className={styles.roleEditorInner}>
                <Input
                  label='Название роли'
                  value={role.name}
                  onChange={(e) => { updateRoleName(roleIdx, e.target.value) }}
                />
                <div className={styles.methodsEditor}>
                  {role.methods.map((method, mIdx) => (
                    <Chip key={`${mIdx}-${method}`} removable removeLabel={`Удалить ${method}`} onRemove={() => { removeMethod(roleIdx, mIdx) }}>
                      {method}
                    </Chip>
                  ))}
                  <AddMethodInput onAdd={(method) => { addMethod(roleIdx, method) }} />
                </div>
              </div>
            </Card>
          ))}
          <Button type='button' variant='secondary' size='sm' icon={<Icon icon={PlusIcon} size='sm' />} onClick={addRole}>Добавить роль</Button>
        </div>
      </form>
    </Section>
  )
}

interface AddMethodInputProps {
  onAdd: (method: string) => void
}

// Manual single-field inline adder (useState + submit handler), not useAutoForm:
// it is not a form with fields/submission — just a compact input for one method inside a role card.
function AddMethodInput ({ onAdd }: AddMethodInputProps): JSX.Element {
  const [value, setValue] = useState('')

  function handleSubmit (): void {
    if (value.trim() === '') return
    onAdd(value)
    setValue('')
  }

  return (
    <div className={styles.addMethodRow}>
      <Input
        aria-label='Название метода'
        value={value}
        onChange={(e) => { setValue(e.target.value) }}
        placeholder='/v1/some/endpoint'
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />
      <Button type='button' variant='ghost' size='sm' icon={<Icon icon={PlusIcon} size='sm' />} onClick={handleSubmit}>Добавить</Button>
    </div>
  )
}
