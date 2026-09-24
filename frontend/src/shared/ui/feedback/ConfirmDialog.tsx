import { type JSX, useEffect, useId, useRef } from 'react'

import styles from './ConfirmDialog.module.scss'
import { Modal } from './Modal.js'

import { Button } from '@/shared/ui/actions/Button.js'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  pending?: boolean
}

export function ConfirmDialog ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pending = false
}: ConfirmDialogProps): JSX.Element {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const descriptionId = useId()

  useEffect(() => {
    if (open && confirmRef.current !== null) {
      confirmRef.current.focus()
    }
  }, [open])

  const handleClose = (): void => {
    if (!pending) {
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} describedBy={descriptionId} size='sm'>
      <div className={styles.content}>
        {description !== undefined && <p id={descriptionId} className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <Button variant='secondary' onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button ref={confirmRef} variant='danger' onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}