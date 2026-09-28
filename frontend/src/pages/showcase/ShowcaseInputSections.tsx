import { type JSX, useState } from 'react'

import styles from './Showcase.module.scss'
import {
  COUNTRY_OPTIONS,
  REGION_OPTIONS,
  SUBSCRIPTION_OPTIONS,
  TAX_OPTIONS,
} from './showcaseOptions.js'

import { Checkbox, Input, Select, Textarea, Toggle } from '@/shared/ui/inputs/index.js'

export function noop(): void {
  /* showcase demo handler */
}

export function InputsSection(): JSX.Element {
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

export function SelectsSection(): JSX.Element {
  const [subscription, setSubscription] = useState('')
  const [taxSystem, setTaxSystem] = useState('')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('')
  return (
    <section id='selects' className={styles.section}>
      <h2 className={styles.sectionTitle}>Select</h2>
      <div className={styles.grid2}>
        <Select
          label='Subscription Type'
          placeholder='Choose...'
          value={subscription}
          onChange={setSubscription}
          options={SUBSCRIPTION_OPTIONS}
        />
        <Select
          label='Tax System'
          value={taxSystem}
          onChange={setTaxSystem}
          options={TAX_OPTIONS}
        />
        <Select
          label='With Error'
          value='a'
          onChange={noop}
          options={[{ value: 'a', label: 'Option A' }]}
          error='Please select a valid option'
        />
        <Select
          label='Disabled'
          value='a'
          onChange={noop}
          options={[{ value: 'a', label: 'Option A' }]}
          disabled
        />
        <Select
          label='Region'
          searchable
          placeholder='Search region...'
          value={region}
          onChange={setRegion}
          options={REGION_OPTIONS}
        />
        <Select
          label='Country'
          placeholder='Choose country...'
          value={country}
          onChange={setCountry}
          options={COUNTRY_OPTIONS}
        />
      </div>
    </section>
  )
}

export function CheckboxSection(): JSX.Element {
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

export function TextareaSection(): JSX.Element {
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

export function ToggleDemo({ label }: { label: string }): JSX.Element {
  const [on, setOn] = useState(false)
  return (
    <div className={styles.row}>
      <Toggle checked={on} onChange={setOn} label={label} />
    </div>
  )
}
