import { CubeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import styles from './AdminDashboard.module.scss'
import { CreateCabinetModal } from './CreateCabinetModal.js'

import { ApiError, deleteCabinet, listCabinets } from '@/shared/api/index.js'
import { formatCellValue, formatDate } from '@/shared/lib/index.js'
import type { CabinetSummary } from '@/shared/model/index.js'
import { Button, CopyButton, Icon, IconButton } from '@/shared/ui/actions/index.js'
import { type Column, Table } from '@/shared/ui/data/index.js'
import { ConfirmDialog, EmptyState, ErrorBanner, Spinner, useToast } from '@/shared/ui/feedback/index.js'

export function AdminDashboard (): JSX.Element {
  const [cabinets, setCabinets] = useState<CabinetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CabinetSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()

  const loadCabinets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listCabinets()
      setCabinets(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Не удалось загрузить продавцов'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCabinets()
  }, [loadCabinets])

  const columns = useMemo<Array<Column<CabinetSummary>>>(() => [
    { key: 'client_id', title: 'Client ID' },
    { key: 'name', title: 'Название', sortable: true },
    { key: 'seller_info', title: 'Компания', renderCell: (_value: unknown, row: CabinetSummary) => {
      const text = formatCellValue(row.seller_info.company.name)
      return text === '' ? <span className={styles.muted}>—</span> : text
    } },
    { key: 'roles', title: 'Срок ключа', renderCell: (_value: unknown, row: CabinetSummary) => formatDate(row.roles.expires_at) },
    { key: 'updated_at', title: 'Обновлено', renderCell: (value: unknown) => formatDate(value) },
    { key: 'actions', title: 'Действия', align: 'end', renderCell: (_value: unknown, row: CabinetSummary) => (
        <div className={styles.actions}>
          <Button variant='link' size='sm' to={`/seller/${row.client_id}`}>Открыть</Button>
          <CopyButton value={row.api_key} label='API-ключ' copiedLabel='Скопировано' />
          <CopyButton value={String(row.client_id)} label='Client ID' copiedLabel='Скопировано' />
          <IconButton variant='danger' size='sm' icon={TrashIcon} ariaLabel='Удалить' onClick={() => { setDeleteTarget(row) }} />
        </div>
      ) }
  ], [])

  function handleCreated (): void {
    setCreateOpen(false)
    void loadCabinets()
    showToast({ tone: 'success', title: 'Продавец создан' })
  }

  async function handleDelete (): Promise<void> {
    if (deleteTarget === null) return
    setDeleting(true)
    try {
      await deleteCabinet(deleteTarget.client_id)
      setDeleteTarget(null)
      void loadCabinets()
      showToast({ tone: 'success', title: 'Продавец удалён' })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Не удалось удалить'
      showToast({ tone: 'danger', title: 'Не удалось удалить', description: message })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.centered}>
        <Spinner size='lg' label='Загрузка продавцов' />
      </div>
    )
  }

  if (error !== null) {
    return (
      <div className={styles.centered}>
        <ErrorBanner message={error} />
        <Button variant='secondary' className={styles.retryButton} onClick={() => { void loadCabinets() }}>
          Повторить
        </Button>
      </div>
    )
  }

  if (cabinets.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={<Icon icon={CubeIcon} size='lg' />}
          title='Продавцов пока нет'
          description='Создайте первый кабинет продавца, чтобы начать тестировать Ozon Seller API в песочнице.'
          action={<Button icon={<Icon icon={PlusIcon} />} onClick={() => { setCreateOpen(true) }}>Создать продавца</Button>}
        />
        <CreateCabinetModal open={createOpen} onClose={() => { setCreateOpen(false) }} onCreated={handleCreated} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Продавцы</h1>
        <Button icon={<Icon icon={PlusIcon} />} onClick={() => { setCreateOpen(true) }}>Создать продавца</Button>
      </div>
      <Table
        columns={columns}
        data={cabinets}
        rowKey={(row) => String(row.client_id)}
        compact
        sticky
        maxHeight='calc(100svh - 200px)'
      />
      <CreateCabinetModal open={createOpen} onClose={() => { setCreateOpen(false) }} onCreated={handleCreated} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => { setDeleteTarget(null) }}
        onConfirm={() => { void handleDelete() }}
        title='Удалить продавца'
        description={`Удалить продавца «${deleteTarget?.name ?? ''}»? Это действие необратимо.`}
        confirmLabel='Удалить'
        pending={deleting}
      />
    </div>
  )
}
