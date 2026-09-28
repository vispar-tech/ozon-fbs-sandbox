import clsx from 'clsx'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, JSX, ReactNode, Ref } from 'react'
import { Link, type To } from 'react-router-dom'

import styles from './Button.module.scss'

import { Spinner } from '@/shared/ui/feedback/Spinner.js'

const btnSpinnerClass = styles.btnSpinner ?? ''

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant | undefined
  size?: ButtonSize | undefined
  loading?: boolean | undefined
  icon?: ReactNode | undefined
  iconSide?: 'left' | 'right' | undefined
  children?: ReactNode | undefined
  to?: To | undefined
  ref?: Ref<HTMLButtonElement> | undefined
}

interface ButtonLinkProps {
  to: To
  className: string
  loading: boolean
  icon: ReactNode
  children: ReactNode
  rest: Omit<ButtonProps, 'to' | 'className' | 'loading' | 'icon' | 'children'>
}

export function Button ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconSide,
  children,
  to,
  className,
  ref,
  ...rest
}: ButtonProps): JSX.Element {
  const isIconOnly = icon !== undefined && children === undefined
  const hasIcon = icon !== undefined && children !== undefined
  const classes = buildButtonClasses({ variant, size, loading, isIconOnly, hasIcon, iconSide, className })

  if (to !== undefined) {
    return (
      <ButtonLink to={to} className={classes} loading={loading} icon={icon} rest={rest}>
        {children}
      </ButtonLink>
    )
  }

  // `type='button'` sits before {...rest} on purpose: an explicit type='submit' from the caller must win over the default
  return (
    <button
      ref={ref}
      className={classes}
      type='button'
      disabled={disabled === true || loading}
      {...rest}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner size='sm' className={btnSpinnerClass} /> : icon}
      {children}
    </button>
  )
}

function ButtonLink ({ to, className, loading, icon, children, rest }: ButtonLinkProps): JSX.Element {
  return (
    <Link
      to={to}
      className={className}
      aria-busy={loading || undefined}
      {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion -- button/anchor event handlers are structurally compatible at runtime
    >
      {loading ? <Spinner size='sm' className={btnSpinnerClass} /> : icon}
      {children}
    </Link>
  )
}

function buildButtonClasses (options: {
  variant: ButtonVariant
  size: ButtonSize
  loading: boolean
  isIconOnly: boolean
  hasIcon: boolean
  iconSide?: 'left' | 'right' | undefined
  className?: string | undefined
}): string {
  return clsx(
    styles.btn,
    styles[`btn${options.variant.charAt(0).toUpperCase()}${options.variant.slice(1)}`],
    styles[`btn${options.size.charAt(0).toUpperCase()}${options.size.slice(1)}`],
    options.loading && styles.btnLoading,
    options.isIconOnly && styles.btnIcon,
    options.hasIcon && (options.iconSide === 'right' ? styles.btnIconRight : styles.btnHasIcon),
    options.className
  )
}
