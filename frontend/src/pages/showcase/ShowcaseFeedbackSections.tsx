import { type JSX, useEffect, useRef, useState } from 'react'

import styles from './Showcase.module.scss'

import { Button } from '@/shared/ui/actions/index.js'
import {
  Alert,
  Badge,
  ConfirmDialog,
  Modal,
  Skeleton,
  useToast,
} from '@/shared/ui/feedback/index.js'

const CONFIRM_DELAY_MS = 1200

export function BadgesSection(): JSX.Element {
  return (
    <section id='badges' className={styles.section}>
      <h2 className={styles.sectionTitle}>Badge</h2>
      <h3 className={styles.subsection}>Variants</h3>
      <div className={styles.row}>
        <Badge variant='default'>Default</Badge>
        <Badge variant='blue'>Blue</Badge>
        <Badge variant='green'>Green</Badge>
        <Badge variant='orange'>Orange</Badge>
        <Badge variant='red'>Red</Badge>
        <Badge variant='magenta'>Magenta</Badge>
      </div>
      <h3 className={styles.subsection}>Sizes</h3>
      <div className={styles.row}>
        <Badge variant='blue' size='sm'>
          Small
        </Badge>
        <Badge variant='blue' size='md'>
          Medium
        </Badge>
        <Badge variant='blue' size='lg'>
          Large
        </Badge>
      </div>
      <h3 className={styles.subsection}>With Dot &amp; Context</h3>
      <div className={styles.row}>
        <Badge variant='green' dot>
          Rating: AA+
        </Badge>
        <Badge variant='magenta'>PREMIUM</Badge>
        <Badge variant='blue'>5 Roles</Badge>
        <Badge variant='default'>No Subscription</Badge>
        <Badge variant='orange' dot>
          Warning
        </Badge>
        <Badge variant='red' dot>
          Critical
        </Badge>
      </div>
    </section>
  )
}

export function AlertSection(): JSX.Element {
  const [dismissed, setDismissed] = useState(false)
  return (
    <section id='alerts' className={styles.section}>
      <h2 className={styles.sectionTitle}>Alert</h2>
      <div className={styles.column}>
        <Alert tone='info' title='Info' description='The sandbox runs against mock fixtures.' />
        <Alert tone='success' title='Success' description='Cabinet saved successfully.' />
        <Alert tone='warning' title='Warning' description='Approaching the API rate limit.' />
        <Alert tone='danger' title='Danger' description='The API key is invalid or expired.' />
        {!dismissed && (
          <Alert
            tone='info'
            title='Dismissible'
            description='Click the close button to hide this alert.'
            dismissible
            onClose={() => {
              setDismissed(true)
            }}
          />
        )}
      </div>
    </section>
  )
}

export function SkeletonSection(): JSX.Element {
  return (
    <section id='skeletons' className={styles.section}>
      <h2 className={styles.sectionTitle}>Skeleton</h2>
      <h3 className={styles.subsection}>Variants</h3>
      <div className={styles.column}>
        <Skeleton variant='text' width='280px' />
        <Skeleton variant='text' width='180px' />
        <div className={styles.row}>
          <Skeleton variant='circle' width='48px' height='48px' />
          <Skeleton variant='rect' width='120px' height='48px' />
        </div>
      </div>
    </section>
  )
}

export function ModalSection(): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <section id='modals' className={styles.section}>
      <h2 className={styles.sectionTitle}>Modal</h2>
      <div className={styles.row}>
        <Button
          onClick={() => {
            setOpen(true)
          }}
        >
          Open Modal
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        title='Edit Cabinet'
        footer={
          <>
            <Button
              onClick={() => {
                setOpen(false)
              }}
            >
              Save Changes
            </Button>
            <Button
              variant='secondary'
              onClick={() => {
                setOpen(false)
              }}
            >
              Cancel
            </Button>
          </>
        }
      >
        <p>
          Focus is trapped inside the dialog. Escape or clicking the backdrop closes it, and focus
          returns to the trigger button.
        </p>
      </Modal>
    </section>
  )
}

export function ConfirmDialogSection(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)
  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current)
    },
    [],
  )
  function handleConfirm(): void {
    setPending(true)
    timeoutRef.current = window.setTimeout(() => {
      setPending(false)
      setOpen(false)
    }, CONFIRM_DELAY_MS)
  }
  return (
    <section id='confirm' className={styles.section}>
      <h2 className={styles.sectionTitle}>ConfirmDialog</h2>
      <div className={styles.row}>
        <Button
          variant='danger'
          onClick={() => {
            setOpen(true)
          }}
        >
          Delete Cabinet
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        onConfirm={handleConfirm}
        title='Delete cabinet?'
        description='This action cannot be undone. The cabinet and its fixtures will be removed from the sandbox.'
        confirmLabel='Delete'
        cancelLabel='Cancel'
        pending={pending}
      />
    </section>
  )
}

export function ToastSection(): JSX.Element {
  const { showToast } = useToast()
  return (
    <section id='toasts' className={styles.section}>
      <h2 className={styles.sectionTitle}>Toast</h2>
      <div className={styles.row}>
        <Button
          onClick={() => {
            showToast({
              tone: 'info',
              title: 'Sync started',
              description: 'Fetching seller info from the API.',
            })
          }}
        >
          Info
        </Button>
        <Button
          onClick={() => {
            showToast({
              tone: 'success',
              title: 'Saved',
              description: 'Cabinet updated successfully.',
            })
          }}
        >
          Success
        </Button>
        <Button
          onClick={() => {
            showToast({
              tone: 'warning',
              title: 'Rate limit',
              description: '80% of the hourly quota used.',
            })
          }}
        >
          Warning
        </Button>
        <Button
          onClick={() => {
            showToast({
              tone: 'danger',
              title: 'Request failed',
              description: 'The API returned a 500 error.',
            })
          }}
        >
          Danger
        </Button>
      </div>
    </section>
  )
}
