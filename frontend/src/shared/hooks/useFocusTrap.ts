import { type RefObject, useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'button',
  'input',
  'select',
  'textarea',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(', ')

export function useFocusTrap (ref: RefObject<HTMLElement | null>, active = true): void {
  useEffect(() => {
    if (!active) {
      return
    }
    const { current: container } = ref
    if (container === null) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return
      }
      const focusable = getFocusableElements(container)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const { activeElement: active } = document
      const isInside = container.contains(active)
      if (event.shiftKey) {
        if (active === focusable[0] || !isInside) {
          event.preventDefault()
          focusable[focusable.length - 1].focus()
        }
      } else if (active === focusable[focusable.length - 1] || !isInside) {
        event.preventDefault()
        focusable[0].focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, active])
}

function getFocusableElements (container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}