import { type JSX, useEffect, useRef, useState } from 'react'

import styles from './Showcase.module.scss'
import { ColorSwatch, COUNTRY_OPTIONS, noop, REGION_OPTIONS, SUBSCRIPTION_OPTIONS, TAX_OPTIONS, TokenScaleDemo, TypeSample } from './ShowcaseHelpers.js'

import { formatCellValue } from '@/shared/lib/index.js'
import type { SubscriptionType } from '@/shared/model/index.js'
import { Button, CopyButton, DropdownMenu, SearchInput, Tooltip } from '@/shared/ui/actions/index.js'
import { Pagination } from '@/shared/ui/data/index.js'
import { Alert, Badge, ConfirmDialog, Modal, Skeleton, useToast } from '@/shared/ui/feedback/index.js'
import { Checkbox, Input, Select, Textarea } from '@/shared/ui/inputs/index.js'
import { Breadcrumbs } from '@/shared/ui/layout/index.js'

const CONFIRM_DELAY_MS = 1200
const DEFAULT_PAGE_SIZE = 10
const PAGINATION_TOTAL = 250
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- page size options are configuration data, not magic numbers
const PAGE_SIZE_OPTIONS: number[] = [10, 20, 50]

const SUBSCRIPTION_BADGE_VARIANT: Record<SubscriptionType, 'default' | 'blue' | 'green' | 'orange' | 'red' | 'magenta'> = {
  UNKNOWN: 'default',
  UNSPECIFIED: 'default',
  PREMIUM: 'magenta',
  PREMIUM_LITE: 'blue',
  PREMIUM_PLUS: 'green',
  PREMIUM_PRO: 'red'
}

export const CABINET_COLUMNS = [
  { key: 'name', title: 'Name', sortable: true, renderCell: (v: unknown): JSX.Element => <strong>{formatCellValue(v)}</strong> },
  { key: 'clientId', title: 'Client ID', renderCell: (v: unknown): JSX.Element => <code>{formatCellValue(v)}</code> },
  { key: 'company', title: 'Company' },
  {
    key: 'subscription', title: 'Subscription',
    renderCell: (v: unknown): JSX.Element => {
      if (v === null || v === undefined) return <Badge variant='default'>None</Badge>
      const text = formatCellValue(v)
      const variant = isSubscriptionType(text) ? SUBSCRIPTION_BADGE_VARIANT[text] : 'default'
      return <Badge variant={variant}>{text}</Badge>
    }
  },
  { key: 'rolesCount', title: 'Roles', sortable: true, renderCell: (v: unknown): JSX.Element => <Badge variant='blue'>{formatCellValue(v)}</Badge> },
  { key: 'updatedAt', title: 'Updated', sortable: true }
]

export const FORM_FIELDS = [
  { name: 'companyName', label: 'Company Name', required: true, placeholder: 'e.g. OOO Romashka' },
  { name: 'inn', label: 'INN', type: 'number' as const, required: true, placeholder: '10-digit number', min: 1000000000, max: 9999999999 },
  { name: 'taxSystem', label: 'Tax System', type: 'select' as const, required: true, options: [
    { value: 'OSNO', label: 'OSNO' }, { value: 'USN', label: 'USN' },
    { value: 'NPD', label: 'NPD' }, { value: 'PSN', label: 'PSN' }
  ]},
  { name: 'isPremium', label: 'Premium Subscription', type: 'toggle' as const },
  { name: 'email', label: 'Contact Email', type: 'email' as const, placeholder: 'admin@example.com' },
  { name: 'roles', label: 'Role Name', placeholder: 'e.g. Admin', required: true }
]

export function TokensSection (): JSX.Element {
  return (
    <section id='tokens' className={styles.section}>
      <h2 className={styles.sectionTitle}>Design Tokens</h2>
      <h3 className={styles.subsection}>Brand Palette</h3>
      <div className={styles.colorGrid}>
        <ColorSwatch name='Ozon Blue' hex='#005BFF' css='--ozon-blue' primary />
        <ColorSwatch name='Magenta' hex='#F1117E' css='--ozon-magenta' />
        <ColorSwatch name='Dark Space' hex='#001A34' css='--ozon-dark-space' />
        <ColorSwatch name='Morning Blue' hex='#00A2FF' css='--ozon-morning-blue' />
        <ColorSwatch name='Green' hex='#00BE6C' css='--ozon-green' />
        <ColorSwatch name='Orange' hex='#FFA800' css='--ozon-orange' />
      </div>
      <h3 className={styles.subsection}>Status Colors</h3>
      <div className={styles.colorGrid}>
        <ColorSwatch name='Success' hex='#00BE6C' css='--color-success' />
        <ColorSwatch name='Warning' hex='#FFA800' css='--color-warning' />
        <ColorSwatch name='Danger' hex='#E53935' css='--color-danger' />
        <ColorSwatch name='Info' hex='#00A2FF' css='--color-info' />
      </div>
      <h3 className={styles.subsection}>Typography Scale</h3>
      <div className={styles.typeScale}>
        <TypeSample size='var(--text-3xl)' label='3xl / 32px' />
        <TypeSample size='var(--text-2xl)' label='2xl / 24px' />
        <TypeSample size='var(--text-xl)' label='xl / 20px' />
        <TypeSample size='var(--text-lg)' label='lg / 18px' />
        <TypeSample size='var(--text-md)' label='md / 16px' />
        <TypeSample size='var(--text-base)' label='base / 14px' />
        <TypeSample size='var(--text-sm)' label='sm / 13px' />
        <TypeSample size='var(--text-xs)' label='xs / 12px' />
      </div>
      <h3 className={styles.subsection}>Spacing</h3>
      <SpacingDemo />
      <h3 className={styles.subsection}>Border Radius</h3>
      <RadiusDemo />
      <h3 className={styles.subsection}>Shadows</h3>
      <ShadowDemo />
    </section>
  )
}

export function ButtonsSection (): JSX.Element {
  return (
    <section id='buttons' className={styles.section}>
      <h2 className={styles.sectionTitle}>Button</h2>
      <h3 className={styles.subsection}>Variants</h3>
      <div className={styles.row}>
        <Button variant='primary'>Primary</Button><Button variant='secondary'>Secondary</Button><Button variant='ghost'>Ghost</Button><Button variant='danger'>Danger</Button><Button variant='link'>Link Button</Button>
      </div>
      <h3 className={styles.subsection}>Sizes</h3>
      <div className={styles.row}>
        <Button size='sm'>Small</Button><Button size='md'>Medium</Button><Button size='lg'>Large</Button>
      </div>
      <h3 className={styles.subsection}>States</h3>
      <div className={styles.row}>
        <Button disabled>Disabled</Button><Button loading>Loading</Button><Button variant='secondary' disabled>Secondary Disabled</Button><Button variant='secondary' loading>Loading</Button>
      </div>
      <h3 className={styles.subsection}>Context Examples</h3>
      <div className={styles.row}>
        <Button>Create Cabinet</Button><Button variant='secondary'>Cancel</Button><Button variant='danger'>Delete</Button><Button variant='ghost'>View Details</Button>
      </div>
    </section>
  )
}

export function InputsSection (): JSX.Element {
  return (
    <section id='inputs' className={styles.section}>
      <h2 className={styles.sectionTitle}>Input</h2>
      <div className={styles.grid2}>
        <Input label='Company Name' placeholder='Enter company name' required />
        <Input label='Client ID' placeholder='e.g. 123456' />
        <Input label='With Error' defaultValue='bad-value' error='This field is required' />
        <Input label='With Hint' placeholder='Optional' hint='Enter your API key' />
        <Input label='Disabled' defaultValue='Read only' disabled />
        <Input label='Email' type='email' placeholder='admin@example.com' />
      </div>
    </section>
  )
}

export function SelectsSection (): JSX.Element {
  const [subscription, setSubscription] = useState('')
  const [taxSystem, setTaxSystem] = useState('')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('')
  return (
    <section id='selects' className={styles.section}>
      <h2 className={styles.sectionTitle}>Select</h2>
      <div className={styles.grid2}>
        <Select label='Subscription Type' placeholder='Choose...' value={subscription} onChange={setSubscription} options={SUBSCRIPTION_OPTIONS} />
        <Select label='Tax System' value={taxSystem} onChange={setTaxSystem} options={TAX_OPTIONS} />
        <Select label='With Error' value='a' onChange={noop} options={[{ value: 'a', label: 'Option A' }]} error='Please select a valid option' />
        <Select label='Disabled' value='a' onChange={noop} options={[{ value: 'a', label: 'Option A' }]} disabled />
        <Select label='Region' searchable placeholder='Search region...' value={region} onChange={setRegion} options={REGION_OPTIONS} />
        <Select label='Country' placeholder='Choose country...' value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
      </div>
    </section>
  )
}

export function BadgesSection (): JSX.Element {
  return (
    <section id='badges' className={styles.section}>
      <h2 className={styles.sectionTitle}>Badge</h2>
      <h3 className={styles.subsection}>Variants</h3>
      <div className={styles.row}>
        <Badge variant='default'>Default</Badge><Badge variant='blue'>Blue</Badge><Badge variant='green'>Green</Badge><Badge variant='orange'>Orange</Badge><Badge variant='red'>Red</Badge><Badge variant='magenta'>Magenta</Badge>
      </div>
      <h3 className={styles.subsection}>Sizes</h3>
      <div className={styles.row}>
        <Badge variant='blue' size='sm'>Small</Badge><Badge variant='blue' size='md'>Medium</Badge><Badge variant='blue' size='lg'>Large</Badge>
      </div>
      <h3 className={styles.subsection}>With Dot &amp; Context</h3>
      <div className={styles.row}>
        <Badge variant='green' dot>Rating: AA+</Badge>
        <Badge variant='magenta'>PREMIUM</Badge>
        <Badge variant='blue'>5 Roles</Badge>
        <Badge variant='default'>No Subscription</Badge>
        <Badge variant='orange' dot>Warning</Badge>
        <Badge variant='red' dot>Critical</Badge>
      </div>
    </section>
  )
}

export function CheckboxSection (): JSX.Element {
  return (
    <section id='checkboxes' className={styles.section}>
      <h2 className={styles.sectionTitle}>Checkbox</h2>
      <div className={styles.row}>
        <Checkbox checked={false} onChange={noop} label='Unchecked' />
        <Checkbox checked={true} onChange={noop} label='Checked' />
        <Checkbox checked={false} onChange={noop} label='Disabled' disabled />
        <Checkbox checked={true} onChange={noop} label='Disabled checked' disabled />
        <Checkbox checked={false} onChange={noop} label='Indeterminate' indeterminate />
        <Checkbox checked={false} onChange={noop} label='With error' error='Required field' />
      </div>
    </section>
  )
}

export function TextareaSection (): JSX.Element {
  return (
    <section id='textareas' className={styles.section}>
      <h2 className={styles.sectionTitle}>Textarea</h2>
      <div className={styles.grid2}>
        <Textarea label='Description' placeholder='Enter a description' />
        <Textarea label='With Error' defaultValue='Too short' error='Minimum 20 characters' />
        <Textarea label='With Hint' placeholder='Optional' hint='Up to 500 characters' />
        <Textarea label='Disabled' defaultValue='Read only content' disabled />
      </div>
    </section>
  )
}

export function AlertSection (): JSX.Element {
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
          <Alert tone='info' title='Dismissible' description='Click the close button to hide this alert.' dismissible onClose={() => { setDismissed(true) }} />
        )}
      </div>
    </section>
  )
}

export function SkeletonSection (): JSX.Element {
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

export function BreadcrumbsSection (): JSX.Element {
  return (
    <section id='breadcrumbs' className={styles.section}>
      <h2 className={styles.sectionTitle}>Breadcrumbs</h2>
      <div className={styles.column}>
        <Breadcrumbs items={[{ label: 'Cabinets', href: '#' }, { label: 'OOO Romashka' }]} />
        <Breadcrumbs items={[{ label: 'Home', href: '#' }, { label: 'Seller API', href: '#' }, { label: 'Roles' }]} separator='›' />
      </div>
    </section>
  )
}

export function PaginationSection (): JSX.Element {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, PAGINATION_TOTAL)
  return (
    <section id='pagination' className={styles.section}>
      <h2 className={styles.sectionTitle}>Pagination</h2>
      <p className={styles.description}>Showing {from}–{to} of {PAGINATION_TOTAL} items</p>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={PAGINATION_TOTAL}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
      />
    </section>
  )
}

export function ModalSection (): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <section id='modals' className={styles.section}>
      <h2 className={styles.sectionTitle}>Modal</h2>
      <div className={styles.row}>
        <Button onClick={() => { setOpen(true) }}>Open Modal</Button>
      </div>
      <Modal open={open} onClose={() => { setOpen(false) }} title='Edit Cabinet'>
        <p>Focus is trapped inside the dialog. Escape or clicking the backdrop closes it, and focus returns to the trigger button.</p>
        <div className={styles.formActions}>
          <Button onClick={() => { setOpen(false) }}>Save Changes</Button>
          <Button variant='secondary' onClick={() => { setOpen(false) }}>Cancel</Button>
        </div>
      </Modal>
    </section>
  )
}

export function ConfirmDialogSection (): JSX.Element {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)
  useEffect(() => () => { window.clearTimeout(timeoutRef.current) }, [])
  function handleConfirm (): void {
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
        <Button variant='danger' onClick={() => { setOpen(true) }}>Delete Cabinet</Button>
      </div>
      <ConfirmDialog
        open={open}
        onClose={() => { setOpen(false) }}
        onConfirm={handleConfirm}
        title='Delete cabinet?'
        description='This action cannot be undone. The cabinet and its fixtures will be removed from the sandbox.'
        confirmLabel='Delete'
        pending={pending}
      />
    </section>
  )
}

export function ToastSection (): JSX.Element {
  const { showToast } = useToast()
  return (
    <section id='toasts' className={styles.section}>
      <h2 className={styles.sectionTitle}>Toast</h2>
      <div className={styles.row}>
        <Button onClick={() => { showToast({ tone: 'info', title: 'Sync started', description: 'Fetching seller info from the API.' }) }}>Info</Button>
        <Button onClick={() => { showToast({ tone: 'success', title: 'Saved', description: 'Cabinet updated successfully.' }) }}>Success</Button>
        <Button onClick={() => { showToast({ tone: 'warning', title: 'Rate limit', description: '80% of the hourly quota used.' }) }}>Warning</Button>
        <Button onClick={() => { showToast({ tone: 'danger', title: 'Request failed', description: 'The API returned a 500 error.' }) }}>Danger</Button>
      </div>
    </section>
  )
}

export function DropdownSection (): JSX.Element {
  return (
    <section id='dropdowns' className={styles.section}>
      <h2 className={styles.sectionTitle}>DropdownMenu</h2>
      <div className={styles.row}>
        <DropdownMenu
          trigger={<Button variant='secondary'>Actions</Button>}
          items={[
            { label: 'View details', onSelect: noop },
            { label: 'Duplicate', onSelect: noop },
            { label: 'Archive', onSelect: noop },
            { label: 'Delete', danger: true, onSelect: noop },
            { label: 'Disabled action', disabled: true }
          ]}
        />
      </div>
    </section>
  )
}

export function TooltipSection (): JSX.Element {
  return (
    <section id='tooltips' className={styles.section}>
      <h2 className={styles.sectionTitle}>Tooltip</h2>
      <div className={styles.row}>
        <Tooltip content='Creates a new seller cabinet' position='top'>
          <Button>Hover me</Button>
        </Tooltip>
        <Tooltip content='Removes the selected cabinet' position='bottom'>
          <Button variant='secondary'>Bottom tooltip</Button>
        </Tooltip>
      </div>
    </section>
  )
}

export function CopySection (): JSX.Element {
  return (
    <section id='copy' className={styles.section}>
      <h2 className={styles.sectionTitle}>CopyButton</h2>
      <div className={styles.row}>
        <CopyButton value='sk_test_1234567890' label='Copy API key' />
        <CopyButton value='https://api-seller.ozon.ru/v1/seller/info' label='Copy endpoint URL' />
      </div>
    </section>
  )
}

export function SearchSection (): JSX.Element {
  const [query, setQuery] = useState('')
  return (
    <section id='search' className={styles.section}>
      <h2 className={styles.sectionTitle}>SearchInput</h2>
      <div className={styles.column}>
        <SearchInput
          label='Search cabinets'
          placeholder='Search by name or client ID'
          value={query}
          onChange={(event) => { setQuery(event.target.value) }}
          onClear={() => { setQuery('') }}
        />
      </div>
    </section>
  )
}

function SpacingDemo (): JSX.Element {
  return (
    <TokenScaleDemo
      items={['space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6', 'space-8', 'space-10', 'space-12']}
      gridClass={styles.spacingGrid}
      itemClass={styles.spacingItem}
      labelClass={styles.spacingLabel}
      renderPreview={(s) => <div className={styles.spacingBar} style={{ width: `var(--${s})` }} />}
    />
  )
}

function RadiusDemo (): JSX.Element {
  return (
    <TokenScaleDemo
      items={['radius-xs', 'radius-sm', 'radius-md', 'radius-lg', 'radius-xl', 'radius-full']}
      gridClass={styles.radiusGrid}
      itemClass={styles.radiusItem}
      labelClass={styles.spacingLabel}
      renderPreview={(r) => <div className={styles.radiusBox} style={{ borderRadius: `var(--${r})` }} />}
    />
  )
}

function ShadowDemo (): JSX.Element {
  return (
    <TokenScaleDemo
      items={['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg']}
      gridClass={styles.shadowGrid}
      itemClass={styles.shadowItem}
      labelClass={styles.spacingLabel}
      renderPreview={(s) => <div className={styles.shadowBox} style={{ boxShadow: `var(--${s})` }} />}
    />
  )
}

function isSubscriptionType (value: string): value is SubscriptionType {
  return value in SUBSCRIPTION_BADGE_VARIANT
}