import { type RefObject, useEffect, useRef } from 'react'

export function useOutsideClick (
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const handleEvent = (event: MouseEvent | TouchEvent): void => {
      const { target } = event
      if (target instanceof Node && ref.current !== null && !ref.current.contains(target)) {
        handlerRef.current(event)
      }
    }

    document.addEventListener('mousedown', handleEvent)
    document.addEventListener('touchstart', handleEvent)
    return () => {
      document.removeEventListener('mousedown', handleEvent)
      document.removeEventListener('touchstart', handleEvent)
    }
  }, [ref])
}