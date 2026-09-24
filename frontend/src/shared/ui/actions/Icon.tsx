import clsx from 'clsx'
import type { ComponentType, JSX, SVGProps } from 'react'

import styles from './Icon.module.scss'

type IconVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type IconSize = 'xs' | 'sm' | 'md' | 'lg'
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

interface IconProps {
  icon: IconComponent
  variant?: IconVariant
  size?: IconSize
  className?: string
}

export function Icon ({
  icon: IconComponent,
  variant,
  size = 'md',
  className = ''
}: IconProps): JSX.Element {
  return (
    <span className={clsx(styles.icon, variant !== undefined && styles[`icon${variant[0].toUpperCase()}${variant.slice(1)}`], styles[`icon${size[0].toUpperCase()}${size.slice(1)}`], className)}>
      <IconComponent aria-hidden='true' />
    </span>
  )
}

export type { IconComponent, IconProps, IconSize, IconVariant }
