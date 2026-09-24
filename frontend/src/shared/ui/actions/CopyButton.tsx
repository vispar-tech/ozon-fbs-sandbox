import { CheckIcon, DocumentDuplicateIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { type JSX, type ReactNode, useEffect, useRef, useState } from 'react'

import { Button, type ButtonProps } from './Button.js'
import styles from './CopyButton.module.scss'
import { Icon } from './Icon.js'

const COPY_RESET_DELAY_MS = 2000

type CopyState = 'idle' | 'copied' | 'error'

interface CopyButtonProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  value: string
  label?: string
  copiedLabel?: string
}

export function CopyButton ({
  value,
  label = 'Копировать',
  copiedLabel = 'Скопировано',
  variant = 'secondary',
  size = 'sm',
  icon,
  className = '',
  ...rest
}: CopyButtonProps): JSX.Element {
  const [state, setState] = useState<CopyState>('idle')
  const resetTimerRef = useRef<number | undefined>(undefined)

  function clearResetTimer (): void {
    if (resetTimerRef.current !== undefined) {
      window.clearTimeout(resetTimerRef.current)
    }
  }

  useEffect(() => clearResetTimer, [])

  function handleCopy (): void {
    try {
      void navigator.clipboard.writeText(value)
        .then(() => { setState('copied') })
        .catch(() => { setState('error') })
        .finally(() => {
          clearResetTimer()
          resetTimerRef.current = window.setTimeout(() => { setState('idle') }, COPY_RESET_DELAY_MS)
        })
    } catch {
      setState('error')
      clearResetTimer()
      resetTimerRef.current = window.setTimeout(() => { setState('idle') }, COPY_RESET_DELAY_MS)
    }
  }

  const isCopied = state === 'copied'
  const isError = state === 'error'

  return (
    <Button
      variant={variant}
      size={size}
      icon={buildStateIcon(isCopied, isError, icon)}
      className={clsx(styles.copyButton, isCopied && styles.copied, isError && styles.error, className)}
      onClick={handleCopy}
      aria-live='polite'
      {...rest}
      type='button'
    >
      {isCopied ? copiedLabel : label}
    </Button>
  )
}

function buildStateIcon (isCopied: boolean, isError: boolean, icon: ReactNode | undefined): ReactNode {
  if (isCopied) {
    return <Icon icon={CheckIcon} size='xs' />
  }
  if (isError) {
    return <Icon icon={ExclamationCircleIcon} size='xs' />
  }
  return icon ?? <Icon icon={DocumentDuplicateIcon} size='xs' />
}