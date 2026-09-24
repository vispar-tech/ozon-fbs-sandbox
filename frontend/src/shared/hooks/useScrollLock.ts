import { useEffect } from 'react'

export function useScrollLock (active: boolean): void {
  useEffect(() => {
    if (!active) {
      return
    }
    const { body } = document
    const { style } = body
    const { overflow: previousOverflow } = style
    if (previousOverflow === 'hidden') {
      return
    }
    style.overflow = 'hidden'
    return () => {
      style.overflow = previousOverflow
    }
  }, [active])
}