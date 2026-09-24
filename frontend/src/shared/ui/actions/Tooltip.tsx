import clsx from 'clsx'
import { cloneElement, isValidElement, type JSX, type ReactNode, useId, useState } from 'react'

import styles from './Tooltip.module.scss'

type TooltipPosition = 'top' | 'bottom'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: TooltipPosition
  className?: string
}

export function Tooltip ({
  content,
  children,
  position = 'top',
  className = ''
}: TooltipProps): JSX.Element {
  const [visible, setVisible] = useState(false)
  const tooltipId = useId()

  return (
    <span
      className={clsx(styles.wrapper, className)}
      onMouseEnter={() => { setVisible(true) }}
      onMouseLeave={() => { setVisible(false) }}
      onFocus={() => { setVisible(true) }}
      onBlur={() => { setVisible(false) }}
    >
      {withDescribedBy(children, visible ? tooltipId : undefined)}
      {visible && (
        <span
          id={tooltipId}
          role='tooltip'
          className={clsx(styles.tooltip, styles[`tooltip${position[0].toUpperCase()}${position.slice(1)}`])}
        >
          {content}
        </span>
      )}
    </span>
  )
}

function withDescribedBy (node: ReactNode, describedBy: string | undefined): ReactNode {
  if (!isValidElement<{ 'aria-describedby'?: string }>(node)) {
    return node
  }
  const { props: { 'aria-describedby': existing } } = node
  if (describedBy === undefined) {
    return cloneElement(node, { 'aria-describedby': existing })
  }
  const merged = existing === undefined ? describedBy : `${existing} ${describedBy}`
  return cloneElement(node, { 'aria-describedby': merged })
}