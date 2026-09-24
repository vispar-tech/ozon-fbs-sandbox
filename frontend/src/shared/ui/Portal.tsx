import type { JSX, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
  target?: HTMLElement
}

export function Portal ({ children, target = document.body }: PortalProps): JSX.Element {
  return createPortal(children, target)
}