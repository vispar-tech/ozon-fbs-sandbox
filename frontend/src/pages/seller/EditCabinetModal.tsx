import type { JSX } from 'react'
import { useCallback } from 'react'

import styles from './EditCabinetModal.module.scss'

import { updateCabinet } from '@/shared/api/index.js'
import { buildFormSchema, FieldRenderer, useAutoForm } from '@/shared/hooks/index.js'
import type { CabinetSummary } from '@/shared/model/index.js'
import { Button } from '@/shared/ui/actions/index.js'
import { ErrorBanner, Modal } from '@/shared/ui/feedback/index.js'

const FIELDS = [
  { name: 'name', label: 'Название', required: true }
]

const schema = buildFormSchema(FIELDS)

interface EditCabinetModalProps {
  open: boolean
  onClose: () => void
  cabinet: CabinetSummary
  onUpdated: () => void
}

export function EditCabinetModal ({ open, onClose, cabinet, onUpdated }: EditCabinetModalProps): JSX.Element {
  const form = useAutoForm({
    fields: FIELDS,
    schema,
    initialValues: { name: cabinet.name },
    onSubmit: useCallback(async (data: Record<string, unknown>) => {
      await updateCabinet(cabinet.client_id, { name: String(data.name) })
      onUpdated()
    }, [cabinet, onUpdated])
  })

  function handleClose (): void {
    form.reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title='Редактировать продавца'
      size='md'
      footer={(
        <>
          <Button type='button' variant='secondary' onClick={handleClose} disabled={form.isSubmitting}>
            Отмена
          </Button>
          <Button type='submit' form='edit-cabinet-form' loading={form.isSubmitting}>
            Сохранить
          </Button>
        </>
      )}
    >
      <form id='edit-cabinet-form' onSubmit={form.handleSubmit} className={styles.form} noValidate>
        {FIELDS.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={form.values[field.name]}
            error={form.errors[field.name]}
            onChange={form.handleChange}
          />
        ))}
        {form.submitError !== null && (
          <ErrorBanner title='Не удалось сохранить' message={form.submitError} />
        )}
      </form>
    </Modal>
  )
}
