import type { JSX, Ref } from 'react'

import { Button, type ButtonProps, type ButtonSize } from './Button.js'
import { Icon, type IconComponent, type IconSize } from './Icon.js'

interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
  icon: IconComponent
  ariaLabel: string
  ref?: Ref<HTMLButtonElement>
}

export function IconButton ({
  icon,
  ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  ref,
  ...rest
}: IconButtonProps): JSX.Element {
  const iconSize = mapButtonSizeToIconSize(size)
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      icon={<Icon icon={icon} size={iconSize} />}
      className={className}
      aria-label={ariaLabel}
      {...rest}
    />
  )
}

function mapButtonSizeToIconSize (buttonSize: ButtonSize): IconSize {
  if (buttonSize === 'lg') return 'lg'
  if (buttonSize === 'sm') return 'sm'
  return 'md'
}
