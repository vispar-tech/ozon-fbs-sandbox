import type { JSX } from 'react'

import styles from './Showcase.module.scss'

interface ColorSwatchProps {
  name: string
  hex: string
  css: string
  primary?: boolean
}

export function ColorSwatch({ name, hex, css, primary = false }: ColorSwatchProps): JSX.Element {
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

export function TypeSample({ size, label }: { size: string; label: string }): JSX.Element {
  return (
    <div className={styles.typeSample}>
      <span style={{ fontSize: size, fontWeight: 'var(--weight-medium)', color: 'var(--text-h)' }}>
        The quick brown fox
      </span>
      <span className={styles.spacingLabel}>{label}</span>
    </div>
  )
}

interface TokenScaleDemoProps {
  items: readonly string[]
  gridClass: string | undefined
  itemClass: string | undefined
  labelClass: string | undefined
  renderPreview: (item: string) => JSX.Element
}

export function TokenScaleDemo({
  items,
  gridClass,
  itemClass,
  labelClass,
  renderPreview,
}: TokenScaleDemoProps): JSX.Element {
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
