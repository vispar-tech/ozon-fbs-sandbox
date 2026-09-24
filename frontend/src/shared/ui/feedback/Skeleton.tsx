import clsx from 'clsx'
import type { JSX } from 'react'

import styles from './Skeleton.module.scss'

type SkeletonVariant = 'text' | 'circle' | 'rect'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string
  height?: string
  className?: string
}

export function Skeleton ({
  variant = 'text',
  width,
  height,
  className = ''
}: SkeletonProps): JSX.Element {
  const classes = clsx(
    styles.skeleton,
    styles[`skeleton${variant[0].toUpperCase()}${variant.slice(1)}`],
    className
  )

  return (
    <span className={classes} style={{ width, height }} aria-hidden='true' />
  )
}