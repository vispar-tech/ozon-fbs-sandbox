import { CubeIcon } from '@heroicons/react/24/outline'
import { type JSX, useState } from 'react'

import styles from './Showcase.module.scss'
import { noop, ToggleDemo } from './ShowcaseHelpers.js'
import {
  AlertSection, BadgesSection, BreadcrumbsSection, ButtonsSection, CABINET_COLUMNS,
  CheckboxSection, ConfirmDialogSection, CopySection, DropdownSection, FORM_FIELDS,
  InputsSection, ModalSection, PaginationSection, SearchSection, SelectsSection,
  SkeletonSection, TextareaSection, ToastSection, TokensSection, TooltipSection
} from './ShowcaseSections.js'

import { buildFormSchema, FieldRenderer, useAutoForm } from '@/shared/hooks/index.js'
import type { SubscriptionType } from '@/shared/model/index.js'
import { Button, Icon } from '@/shared/ui/actions/index.js'
import { Table, Tabs } from '@/shared/ui/data/index.js'
import { Chip, EmptyState, ErrorBanner, Spinner } from '@/shared/ui/feedback/index.js'
import { Toggle } from '@/shared/ui/inputs/index.js'
import { Section } from '@/shared/ui/layout/index.js'

const SECTIONS = [
  { id: 'tokens', title: 'Tokens' },
  { id: 'buttons', title: 'Button' },
  { id: 'inputs', title: 'Input' },
  { id: 'selects', title: 'Select' },
  { id: 'checkboxes', title: 'Checkbox' },
  { id: 'textareas', title: 'Textarea' },
  { id: 'badges', title: 'Badge' },
  { id: 'alerts', title: 'Alert' },
  { id: 'skeletons', title: 'Skeleton' },
  { id: 'chips', title: 'Chip' },
  { id: 'tabs', title: 'Tabs' },
  { id: 'breadcrumbs', title: 'Breadcrumbs' },
  { id: 'sections', title: 'Section' },
  { id: 'tables', title: 'Table' },
  { id: 'pagination', title: 'Pagination' },
  { id: 'empty', title: 'EmptyState' },
  { id: 'spinners', title: 'Spinner' },
  { id: 'errors', title: 'ErrorBanner' },
  { id: 'modals', title: 'Modal' },
  { id: 'confirm', title: 'ConfirmDialog' },
  { id: 'toasts', title: 'Toast' },
  { id: 'dropdowns', title: 'DropdownMenu' },
  { id: 'tooltips', title: 'Tooltip' },
  { id: 'copy', title: 'CopyButton' },
  { id: 'search', title: 'SearchInput' },
  { id: 'toggles', title: 'Toggle' },
  { id: 'autoform', title: 'Auto-Form' }
]

const formSchema = buildFormSchema(FORM_FIELDS)

const MOCK_CABINETS: CabinetRow[] = [
  { id: '1', name: 'OOO Romashka', clientId: '123456', company: 'OOO Romashka', subscription: 'PREMIUM', rolesCount: 5, updatedAt: '2026-09-20' },
  { id: '2', name: 'IP Ivanov', clientId: '789012', company: 'IP Ivanov A.V.', subscription: 'PREMIUM_LITE', rolesCount: 2, updatedAt: '2026-09-19' },
  { id: '3', name: 'ZAO Technologii', clientId: '345678', company: 'ZAO Technologii Budushchego', subscription: null, rolesCount: 0, updatedAt: '2026-09-18' },
  { id: '4', name: 'OOO Vector', clientId: '901234', company: 'OOO Vector Trade', subscription: 'PREMIUM_PLUS', rolesCount: 8, updatedAt: '2026-09-17' },
  { id: '5', name: 'IP Petrova', clientId: '567890', company: 'IP Petrova E.S.', subscription: 'PREMIUM_LITE', rolesCount: 1, updatedAt: '2026-09-16' },
  { id: '6', name: 'OOO Alfa', clientId: '112233', company: 'OOO Alfa Group', subscription: 'PREMIUM', rolesCount: 4, updatedAt: '2026-09-15' },
  { id: '7', name: 'IP Sidorov', clientId: '445566', company: 'IP Sidorov K.V.', subscription: null, rolesCount: 0, updatedAt: '2026-09-14' },
  { id: '8', name: 'OOO Beta', clientId: '778899', company: 'OOO Beta Solutions', subscription: 'PREMIUM_PRO', rolesCount: 12, updatedAt: '2026-09-13' },
  { id: '9', name: 'IP Kuznetsova', clientId: '998877', company: 'IP Kuznetsova A.A.', subscription: 'PREMIUM_LITE', rolesCount: 2, updatedAt: '2026-09-12' },
  { id: '10', name: 'OOO Gamma', clientId: '665544', company: 'OOO Gamma Digital', subscription: 'PREMIUM_PLUS', rolesCount: 6, updatedAt: '2026-09-11' }
]

const EMPTY_CABINETS: CabinetRow[] = []

interface CabinetRow extends Record<string, unknown> {
  id: string
  name: string
  clientId: string
  company: string
  subscription: SubscriptionType | null
  rolesCount: number
  updatedAt: string
}

export function Showcase (): JSX.Element {
  const [activeTab, setActiveTab] = useState('overview')
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [chips, setChips] = useState(['Ozon Blue', 'FBS', 'Sandbox'])
  const form = useAutoForm({ fields: FORM_FIELDS, schema: formSchema, onSubmit: noop })
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [sortInfo, setSortInfo] = useState('none')

  return (
    <div className={styles.showcase}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Design System</span>
        <h1 className={styles.title}>Ozon Sandbox</h1>
        <p className={styles.subtitle}>Component library &amp; design tokens for the admin dashboard</p>
      </header>
      <nav className={styles.nav} aria-label='Sections'>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={styles.navLink}>{s.title}</a>
        ))}
      </nav>

      <TokensSection />
      <ButtonsSection />
      <InputsSection />
      <SelectsSection />
      <CheckboxSection />
      <TextareaSection />
      <BadgesSection />
      <AlertSection />
      <SkeletonSection />

      <section id='chips' className={styles.section}>
        <h2 className={styles.sectionTitle}>Chip</h2>
        <h3 className={styles.subsection}>Default</h3>
        <div className={styles.row}><Chip>FBS</Chip><Chip>FBO</Chip><Chip active>Sandbox</Chip></div>
        <h3 className={styles.subsection}>Interactive</h3>
        <div className={styles.row}>
          <Chip onClick={noop}>Click me</Chip>
          <Chip active onClick={noop}>Active Click</Chip>
        </div>
        <h3 className={styles.subsection}>Removable</h3>
        <div className={styles.row}>
          {chips.map((c, i) => (
            <Chip key={c} removable onRemove={() => { setChips((p) => p.filter((_, idx) => idx !== i)) }} removeLabel={`Remove ${c}`}>{c}</Chip>
          ))}
        </div>
        <h3 className={styles.subsection}>Context: Method Tags</h3>
        <div className={styles.row}><Chip>/v1/seller/info</Chip><Chip>/v1/roles</Chip><Chip active>/v1/actions</Chip></div>
      </section>

      <section id='tabs' className={styles.section}>
        <h2 className={styles.sectionTitle}>Tabs</h2>
        <Tabs tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'roles', label: 'Roles', count: 5 },
          { key: 'fixtures', label: 'Fixtures' }
        ]} activeKey={activeTab} onChange={setActiveTab}>
          <div><p>Overview: company details, subscription status, and ratings.</p></div>
          <div><p>Roles management: list of roles with assigned API methods.</p></div>
          <div><p>Fixture editors for seller-info and roles data.</p></div>
        </Tabs>
      </section>

      <BreadcrumbsSection />

      <section id='sections' className={styles.section}>
        <h2 className={styles.sectionTitle}>Section / Card</h2>
        <div className={styles.grid2}>
          <Section title='Company Info'><p>Basic section with header and body.</p></Section>
          <Section title='Actions' actions={<Button size='sm' variant='secondary'>Edit</Button>}><p>Section with header action.</p></Section>
          <Section title='Flush' flush><div className={styles.flushContent}>Flush content, no body padding.</div></Section>
          <Section><p>Section without title.</p></Section>
        </div>
      </section>

      <section id='tables' className={styles.section}>
        <h2 className={styles.sectionTitle}>Table</h2>
        <Section title='Cabinets' actions={<Button size='sm'>+ New</Button>}>
          <Table columns={CABINET_COLUMNS} data={MOCK_CABINETS} rowKey={(row) => row.id} />
        </Section>
        <div className={styles.tableSpacing}>
          <Section title='Compact Table'>
            <Table
              columns={[{ key: 'method', title: 'Method' }, { key: 'path', title: 'Path' }, { key: 'status', title: 'Status' }]}
              data={[{ method: 'POST', path: '/v1/seller/info', status: '200' }, { method: 'POST', path: '/v1/roles', status: '200' }]}
              rowKey={(row) => `${row.method}-${row.path}-${row.status}`}
              compact
            />
          </Section>
        </div>
        <div className={styles.tableSpacing}>
          <Section title='Sortable, Selectable &amp; Sticky'>
            <p className={styles.description}>Selected: {selectedKeys.length} · Sort: {sortInfo}</p>
            <Table
              columns={CABINET_COLUMNS}
              data={MOCK_CABINETS}
              rowKey={(row) => row.id}
              selectable
              sticky
              maxHeight='320px'
              rowDisabled={(row) => row.id === '3'}
              onSelectionChange={setSelectedKeys}
              onSortChange={(key, direction) => { setSortInfo(`${key ?? 'none'} (${direction})`) }}
            />
          </Section>
        </div>
        <div className={styles.tableSpacing}>
          <Section title='Empty State'>
            <Table columns={CABINET_COLUMNS} data={EMPTY_CABINETS} rowKey={(row) => row.id} emptyMessage='No cabinets match your filters' />
          </Section>
        </div>
      </section>

      <PaginationSection />

      <section id='empty' className={styles.section}>
        <h2 className={styles.sectionTitle}>EmptyState</h2>
        <Section>
          <EmptyState
            icon={<Icon icon={CubeIcon} size='lg' />}
            title='No cabinets yet'
            description='Create your first seller cabinet to start testing the Ozon Seller API sandbox.'
            action={<Button>Create Cabinet</Button>}
          />
        </Section>
      </section>

      <section id='spinners' className={styles.section}>
        <h2 className={styles.sectionTitle}>Spinner</h2>
        <div className={styles.row}>
          {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
            <div key={s} className={styles.spinnerCell}><Spinner size={s} /><span className={styles.spacingLabel}>{s}</span></div>
          ))}
        </div>
      </section>

      <section id='errors' className={styles.section}>
        <h2 className={styles.sectionTitle}>ErrorBanner</h2>
        {!errorDismissed && (
          <ErrorBanner title='Failed to load cabinets' message='The backend server is unreachable. Check that the API is running on port 3000.' onDismiss={() => { setErrorDismissed(true) }} />
        )}
        {errorDismissed && (
          <Button variant='secondary' onClick={() => { setErrorDismissed(false) }}>Show Error Again</Button>
        )}
        <div className={styles.errorSpacing}>
          <ErrorBanner title='Validation Error' message='Client-Id must be a positive integer.' />
        </div>
      </section>

      <ModalSection />
      <ConfirmDialogSection />
      <ToastSection />
      <DropdownSection />
      <TooltipSection />
      <CopySection />
      <SearchSection />

      <section id='toggles' className={styles.section}>
        <h2 className={styles.sectionTitle}>Toggle</h2>
        <ToggleDemo label='Enable Premium Features' />
        <ToggleDemo label='Simulate Error' />
        <div className={styles.row}><Toggle checked={false} onChange={noop} disabled label='Disabled (off)' /></div>
        <div className={styles.row}><Toggle checked={true} onChange={noop} disabled label='Disabled (on)' /></div>
      </section>

      <section id='autoform' className={styles.section}>
        <h2 className={styles.sectionTitle}>Auto-Form</h2>
        <p className={styles.description}>Declarative form via <code>useAutoForm</code> + <code>buildFormSchema</code> + <code>FieldRenderer</code>. Submit empty to see per-field errors.</p>
        <Section title='Cabinet Editor' actions={<Button variant='ghost' size='sm' onClick={form.reset}>Reset</Button>}>
          <form onSubmit={form.handleSubmit} className={styles.form} noValidate>
            {FORM_FIELDS.map((field) => (
              <FieldRenderer key={field.name} field={field} value={form.values[field.name]} error={form.errors[field.name]} onChange={form.handleChange} />
            ))}
            <div className={styles.formActions}>
              <Button type='submit' loading={form.isSubmitting}>Save Cabinet</Button>
              <Button type='button' variant='secondary' onClick={form.reset}>Reset</Button>
            </div>
          </form>
        </Section>
      </section>

      <footer className={styles.footer}><p>Ozon Sandbox Design System &mdash; Foundation layer for admin dashboard</p></footer>
      </div>
  )
}
