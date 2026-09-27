import { PlusIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'
import { useState } from 'react'

import styles from './RolesEditor.module.scss'

import { updateCabinet } from '@/shared/api/index.js'
import { buildFormSchema, type FieldDefinition, FieldRenderer, useAutoForm } from '@/shared/hooks/index.js'
import type { CabinetSummary, Roles } from '@/shared/model/index.js'
import { Button, Icon } from '@/shared/ui/actions/index.js'
import { Chip, ErrorBanner, useToast } from '@/shared/ui/feedback/index.js'
import { Input } from '@/shared/ui/inputs/index.js'
import { Card, Section } from '@/shared/ui/layout/index.js'

const ROLES_FIELDS: FieldDefinition[] = [{ name: 'expires_at', label: 'Срок действия ключа' }]

const ROLES_SCHEMA = buildFormSchema(ROLES_FIELDS)

interface RolesEditorProps {
  cabinet: CabinetSummary
  onUpdated: () => void
}

interface RolesFormValues extends Record<string, unknown> {
  expires_at: string
  roles: Roles['roles']
}

export function RolesEditor ({ cabinet, onUpdated }: RolesEditorProps): JSX.Element {
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
