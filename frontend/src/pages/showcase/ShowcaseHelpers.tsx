import { type JSX, useState } from 'react'

import styles from './Showcase.module.scss'

import type { SubscriptionType, TaxSystem } from '@/shared/model/index.js'
import { Toggle } from '@/shared/ui/inputs/index.js'

export function noop (): void { /* showcase demo handler */ }

export const SUBSCRIPTION_OPTIONS: Array<{ value: SubscriptionType; label: string }> = [
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PREMIUM_LITE', label: 'Premium Lite' },
  { value: 'PREMIUM_PLUS', label: 'Premium Plus' }
]

export const TAX_OPTIONS: Array<{ value: TaxSystem; label: string }> = [
  { value: 'OSNO', label: 'OSNO' },
  { value: 'USN', label: 'USN' },
  { value: 'NPD', label: 'NPD' }
]

export const REGION_OPTIONS = [
  { value: 'moscow', label: 'Moscow' },
  { value: 'spb', label: 'Saint Petersburg' },
  { value: 'novosibirsk', label: 'Novosibirsk' },
  { value: 'ekaterinburg', label: 'Yekaterinburg' },
  { value: 'kazan', label: 'Kazan' },
  { value: 'nn', label: 'Nizhny Novgorod' },
  { value: 'chelyabinsk', label: 'Chelyabinsk' },
  { value: 'krasnoyarsk', label: 'Krasnoyarsk' },
  { value: 'samara', label: 'Samara' },
  { value: 'ufa', label: 'Ufa' },
  { value: 'rostov', label: 'Rostov-on-Don' },
  { value: 'omsk', label: 'Omsk' }
]

export const COUNTRY_OPTIONS = [
  { value: 'ru', label: 'Russia' },
  { value: 'by', label: 'Belarus' },
  { value: 'kz', label: 'Kazakhstan' },
  { value: 'am', label: 'Armenia' },
  { value: 'kg', label: 'Kyrgyzstan' },
  { value: 'uz', label: 'Uzbekistan' },
  { value: 'tj', label: 'Tajikistan' },
  { value: 'tm', label: 'Turkmenistan' },
  { value: 'az', label: 'Azerbaijan' },
  { value: 'ge', label: 'Georgia' },
  { value: 'md', label: 'Moldova' },
  { value: 'ua', label: 'Ukraine' },
  { value: 'pl', label: 'Poland' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy' },
  { value: 'es', label: 'Spain' },
  { value: 'pt', label: 'Portugal' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'be', label: 'Belgium' },
  { value: 'at', label: 'Austria' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'cz', label: 'Czech Republic' },
  { value: 'tr', label: 'Turkey' }
]

interface ColorSwatchProps {
  name: string
  hex: string
  css: string
  primary?: boolean
}

export function ColorSwatch ({ name, hex, css, primary = false }: ColorSwatchProps): JSX.Element {
  return (
    <div className={`${styles.swatch}${primary ? ` ${styles.swatchPrimary}` : ''}`}>
      <div className={styles.swatchColor} style={{ background: hex }} />
      <div className={styles.swatchInfo}>
        <span className={styles.swatchName}>{name}</span>
        <span className={styles.swatchHex}>{hex}</span>
        <span className={styles.swatchCss}>var({css})</span>
      </div>
    </div>
  )
}

export function TypeSample ({ size, label }: { size: string; label: string }): JSX.Element {
  return (
    <div className={styles.typeSample}>
      <span style={{ fontSize: size, fontWeight: 500, color: 'var(--text-h)' }}>The quick brown fox</span>
      <span className={styles.spacingLabel}>{label}</span>
    </div>
  )
}

export function ToggleDemo ({ label }: { label: string }): JSX.Element {
  const [on, setOn] = useState(false)
  return (
    <div className={styles.row}>
      <Toggle checked={on} onChange={setOn} label={label} />
    </div>
  )
}

interface TokenScaleDemoProps {
  items: readonly string[]
  gridClass: string
  itemClass: string
  labelClass: string
  renderPreview: (item: string) => JSX.Element
}

export function TokenScaleDemo ({ items, gridClass, itemClass, labelClass, renderPreview }: TokenScaleDemoProps): JSX.Element {
  return (
    <div className={gridClass}>
      {items.map((s) => (
        <div key={s} className={itemClass}>
          {renderPreview(s)}
          <span className={labelClass}>{s.slice(s.indexOf('-') + 1)}</span>
        </div>
      ))}
    </div>
  )
}
