import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EditCabinetModal } from './EditCabinetModal.js'
import { FixturesTab } from './FixturesTab.js'
import { OverviewTab } from './OverviewTab.js'
import { RequestsTab } from './RequestsTab.js'
import styles from './SellerDetails.module.scss'

import { ApiError, deleteCabinet, getCabinet } from '@/shared/api/index.js'
import { errorMessageOr } from '@/shared/lib/index.js'
import type { CabinetSummary } from '@/shared/model/index.js'
import { Button, Icon, IconButton } from '@/shared/ui/actions/index.js'
import { Tabs } from '@/shared/ui/data/index.js'
import { CenteredStatus, ConfirmDialog, useToast } from '@/shared/ui/feedback/index.js'
import { Breadcrumbs } from '@/shared/ui/layout/index.js'

const NOT_FOUND = 404

const TABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'fixtures', label: 'Фикстуры' },
  { key: 'requests', label: 'Запросы' }
]

export function SellerDetails (): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [cabinet, setCabinet] = useState<CabinetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const requestIdRef = useRef(0)

  const handleLoadError = useCallback((err: unknown): void => {
    if (err instanceof ApiError && err.status === NOT_FOUND) {
      setNotFound(true)
    } else {
      setError(errorMessageOr(err, 'Не удалось загрузить продавца'))
    }
  }, [])

  const loadCabinet = useCallback(async (options?: { silent?: boolean }) => {
    if (id === undefined) {
      setError('Не удалось загрузить продавца')
      setLoading(false)
      return
    }
    if (options?.silent !== true) {
      setLoading(true)
      setError(null)
      setNotFound(false)
    }
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    try {
      const data = await getCabinet(Number(id))
      if (requestId !== requestIdRef.current) return
      setCabinet(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      handleLoadError(err)
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [id, handleLoadError])

  useEffect(() => {
    void loadCabinet()
  }, [loadCabinet])

  function handleUpdated (): void {
    setEditOpen(false)
    void loadCabinet()
    showToast({ tone: 'success', title: 'Продавец обновлён' })
  }

  async function handleDelete (): Promise<void> {
    if (cabinet === null) return
    setDeleting(true)
    try {
      await deleteCabinet(cabinet.client_id)
      showToast({ tone: 'success', title: 'Продавец удалён' })
      void navigate('/')
    } catch (err) {
      showToast({ tone: 'danger', title: 'Не удалось удалить', description: errorMessageOr(err, 'Не удалось удалить') })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <CenteredStatus status='loading' label='Загрузка продавца' />
  }

  if (notFound) {
    return (
      <CenteredStatus status='error' title='Продавец не найден' message='Запрошенный кабинет не существует.'>
        <Link to='/'>Назад к списку</Link>
      </CenteredStatus>
    )
  }

  if (error !== null) {
    return <CenteredStatus status='error' message={error} onRetry={() => { void loadCabinet() }} />
  }

  if (cabinet === null) return <></>

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Продавцы', href: '/' },
          { label: cabinet.name }
        ]}
        renderLink={(item, linkClassName) => (
          <Link to={item.href ?? '/'} className={linkClassName}>{item.label}</Link>
        )}
      />
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{cabinet.name}</h1>
          <span className={styles.clientId}>{cabinet.client_id}</span>
        </div>
        <div className={styles.actions}>
          <Button variant='secondary' icon={<Icon icon={PencilIcon} />} onClick={() => { setEditOpen(true) }}>Редактировать</Button>
          <IconButton variant='danger' icon={TrashIcon} ariaLabel='Удалить' onClick={() => { setDeleteOpen(true) }} />
        </div>
      </div>
      <Tabs tabs={TABS}>
        <OverviewTab cabinet={cabinet} />
        <FixturesTab key={cabinet.client_id} cabinet={cabinet} onUpdated={() => { void loadCabinet({ silent: true }) }} />
        <RequestsTab key={cabinet.client_id} cabinet={cabinet} />
      </Tabs>
      <EditCabinetModal
        open={editOpen}
        onClose={() => { setEditOpen(false) }}
        cabinet={cabinet}
        onUpdated={handleUpdated}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false) }}
        onConfirm={() => { void handleDelete() }}
        title='Удалить продавца'
        description={`Удалить продавца «${cabinet.name}»? Это действие необратимо.`}
        confirmLabel='Удалить'
        pending={deleting}
      />
    </div>
  )
}
