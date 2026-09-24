import type { JSX } from 'react'
import { useCallback } from 'react'

import styles from './CreateCabinetModal.module.scss'

import { createCabinet } from '@/shared/api/index.js'
import { buildFormSchema, FieldRenderer, useAutoForm } from '@/shared/hooks/index.js'
import { Button } from '@/shared/ui/actions/index.js'
import { ErrorBanner, Modal } from '@/shared/ui/feedback/index.js'

const FIELDS = [
  { name: 'name', label: 'Название', placeholder: 'ООО Ромашка', required: true },
  { name: 'demo', label: 'Заполнить демо-данными', type: 'toggle' as const }
]

const schema = buildFormSchema(FIELDS)

interface CreateCabinetModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateCabinetModal ({ open, onClose, onCreated }: CreateCabinetModalProps): JSX.Element {
  const form = useAutoForm({
    fields: FIELDS,
    schema,
    onSubmit: useCallback(async (data: Record<string, unknown>) => {
      await createCabinet({
        name: String(data.name),
        demo: data.demo === true ? true : undefined
      })
      onCreated()
    }, [onCreated])
  })

  function handleClose (): void {
    form.reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title='Создать продавца' size='md'>
      <form onSubmit={form.handleSubmit} className={styles.form} noValidate>
        {FIELDS.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={form.values[field.name]}
            error={form.errors[field.name]}
            onChange={form.handleChange}
          />
        ))}
        <p className={styles.hint}>Client ID и API-ключ генерируются автоматически.</p>
        {form.submitError !== null && (
          <ErrorBanner title='Не удалось создать' message={form.submitError} />
        )}
        <div className={styles.actions}>
          <Button type='button' variant='secondary' onClick={handleClose} disabled={form.isSubmitting}>
            Отмена
          </Button>
          <Button type='submit' loading={form.isSubmitting}>
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  )
}
