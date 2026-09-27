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
      const first = focusable.at(0)
      const last = focusable.at(focusable.length - 1)
      if (first === undefined || last === undefined) {
        // Nothing focusable inside — block Tab so focus cannot leave the container
        event.preventDefault()
        return
      }
      const { activeElement: active } = document
      const isInside = container.contains(active)
      if (event.shiftKey) {
        if (active === first || !isInside) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !isInside) {
        event.preventDefault()
        first.focus()
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