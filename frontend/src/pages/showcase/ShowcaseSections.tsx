import { type JSX, useState } from 'react'

import styles from './Showcase.module.scss'
import { noop } from './ShowcaseInputSections.js'
import { ColorSwatch, TokenScaleDemo, TypeSample } from './tokenSamples.js'

import { formatCellValue } from '@/shared/lib/index.js'
import type { SubscriptionType } from '@/shared/model/index.js'
import { Button, CopyButton, DropdownMenu, Tooltip } from '@/shared/ui/actions/index.js'
import { Pagination } from '@/shared/ui/data/index.js'
import { Badge } from '@/shared/ui/feedback/index.js'
import { SearchInput } from '@/shared/ui/inputs/index.js'
import { Breadcrumbs } from '@/shared/ui/layout/index.js'

const DEFAULT_PAGE_SIZE = 10
const PAGINATION_TOTAL = 250
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- page size options are configuration data, not magic numbers
const PAGE_SIZE_OPTIONS: number[] = [10, 20, 50]

const SUBSCRIPTION_BADGE_VARIANT: Record<
  SubscriptionType,
  'default' | 'blue' | 'green' | 'orange' | 'red' | 'magenta'
> = {
  UNKNOWN: 'default',
  UNSPECIFIED: 'default',
  PREMIUM: 'magenta',
  PREMIUM_LITE: 'blue',
  PREMIUM_PLUS: 'green',
  PREMIUM_PRO: 'red',
}

export const CABINET_COLUMNS = [
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    renderCell: (v: unknown): JSX.Element => <strong>{formatCellValue(v)}</strong>,
  },
  {
    key: 'clientId',
    title: 'Client ID',
    renderCell: (v: unknown): JSX.Element => <code>{formatCellValue(v)}</code>,
  },
  { key: 'company', title: 'Company' },
  {
    key: 'subscription',
    title: 'Subscription',
    renderCell: (v: unknown): JSX.Element => {
      if (v === null || v === undefined) return <Badge variant='default'>None</Badge>
      const text = formatCellValue(v)
      const variant = isSubscriptionType(text) ? SUBSCRIPTION_BADGE_VARIANT[text] : 'default'
      return <Badge variant={variant}>{text}</Badge>
    },
  },
  {
    key: 'rolesCount',
    title: 'Roles',
    sortable: true,
    renderCell: (v: unknown): JSX.Element => <Badge variant='blue'>{formatCellValue(v)}</Badge>,
  },
  { key: 'updatedAt', title: 'Updated', sortable: true },
]

export const FORM_FIELDS = [
  { name: 'companyName', label: 'Company Name', required: true, placeholder: 'e.g. OOO Romashka' },
  {
    name: 'inn',
    label: 'INN',
    type: 'number' as const,
    required: true,
    placeholder: '10-digit number',
    min: 1000000000,
    max: 9999999999,
  },
  {
    name: 'taxSystem',
    label: 'Tax System',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'OSNO', label: 'OSNO' },
      { value: 'USN', label: 'USN' },
      { value: 'NPD', label: 'NPD' },
      { value: 'PSN', label: 'PSN' },
    ],
  },
  { name: 'isPremium', label: 'Premium Subscription', type: 'toggle' as const },
  {
    name: 'email',
    label: 'Contact Email',
    type: 'email' as const,
    placeholder: 'admin@example.com',
  },
  { name: 'roles', label: 'Role Name', placeholder: 'e.g. Admin', required: true },
]

export function TokensSection(): JSX.Element {
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

export function ButtonsSection(): JSX.Element {
  return (
    <section id='buttons' className={styles.section}>
      <h2 className={styles.sectionTitle}>Button</h2>
      <h3 className={styles.subsection}>Variants</h3>
      <div className={styles.row}>
        <Button variant='primary'>Primary</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='ghost'>Ghost</Button>
        <Button variant='danger'>Danger</Button>
        <Button variant='link'>Link Button</Button>
      </div>
      <h3 className={styles.subsection}>Sizes</h3>
      <div className={styles.row}>
        <Button size='sm'>Small</Button>
        <Button size='md'>Medium</Button>
        <Button size='lg'>Large</Button>
      </div>
      <h3 className={styles.subsection}>States</h3>
      <div className={styles.row}>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Button variant='secondary' disabled>
          Secondary Disabled
        </Button>
        <Button variant='secondary' loading>
          Loading
        </Button>
      </div>
      <h3 className={styles.subsection}>Context Examples</h3>
      <div className={styles.row}>
        <Button>Create Cabinet</Button>
        <Button variant='secondary'>Cancel</Button>
        <Button variant='danger'>Delete</Button>
        <Button variant='ghost'>View Details</Button>
      </div>
    </section>
  )
}

export function BreadcrumbsSection(): JSX.Element {
  return (
    <section id='breadcrumbs' className={styles.section}>
      <h2 className={styles.sectionTitle}>Breadcrumbs</h2>
      <div className={styles.column}>
        <Breadcrumbs items={[{ label: 'Cabinets', href: '#' }, { label: 'OOO Romashka' }]} />
        <Breadcrumbs
          items={[
            { label: 'Home', href: '#' },
            { label: 'Seller API', href: '#' },
            { label: 'Roles' },
          ]}
          separator='›'
        />
      </div>
    </section>
  )
}

export function PaginationSection(): JSX.Element {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, PAGINATION_TOTAL)
  return (
    <section id='pagination' className={styles.section}>
      <h2 className={styles.sectionTitle}>Pagination</h2>
      <p className={styles.description}>
        Showing {from}–{to} of {PAGINATION_TOTAL} items
      </p>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={PAGINATION_TOTAL}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </section>
  )
}

export function DropdownSection(): JSX.Element {
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
            { label: 'Disabled action', disabled: true },
          ]}
        />
      </div>
    </section>
  )
}

export function TooltipSection(): JSX.Element {
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

export function CopySection(): JSX.Element {
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

export function SearchSection(): JSX.Element {
  const [query, setQuery] = useState('')
  return (
    <section id='search' className={styles.section}>
      <h2 className={styles.sectionTitle}>SearchInput</h2>
      <div className={styles.column}>
        <SearchInput
          label='Search cabinets'
          placeholder='Search by name or client ID'
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
          }}
          onClear={() => {
            setQuery('')
          }}
        />
      </div>
    </section>
  )
}

function SpacingDemo(): JSX.Element {
  return (
    <TokenScaleDemo
      items={[
        'space-1',
        'space-2',
        'space-3',
        'space-4',
        'space-5',
        'space-6',
        'space-8',
        'space-10',
        'space-12',
      ]}
      gridClass={styles.spacingGrid}
      itemClass={styles.spacingItem}
      labelClass={styles.spacingLabel}
      renderPreview={(s) => <div className={styles.spacingBar} style={{ width: `var(--${s})` }} />}
    />
  )
}

function RadiusDemo(): JSX.Element {
  return (
    <TokenScaleDemo
      items={['radius-xs', 'radius-sm', 'radius-md', 'radius-lg', 'radius-xl', 'radius-full']}
      gridClass={styles.radiusGrid}
      itemClass={styles.radiusItem}
      labelClass={styles.spacingLabel}
      renderPreview={(r) => (
        <div className={styles.radiusBox} style={{ borderRadius: `var(--${r})` }} />
      )}
    />
  )
}

function ShadowDemo(): JSX.Element {
  return (
    <TokenScaleDemo
      items={['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg']}
      gridClass={styles.shadowGrid}
      itemClass={styles.shadowItem}
      labelClass={styles.spacingLabel}
      renderPreview={(s) => (
        <div className={styles.shadowBox} style={{ boxShadow: `var(--${s})` }} />
      )}
    />
  )
}

function isSubscriptionType(value: string): value is SubscriptionType {
  return value in SUBSCRIPTION_BADGE_VARIANT
}
