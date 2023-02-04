import { useCallback, useRef } from 'react'

export const useDebouncedCallback = (func: Function, wait: number) => {
  const timeout = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args) => {
      const later = () => {
        if (timeout.current) clearTimeout(timeout.current)
        func(...args)
      }

      if (timeout.current) clearTimeout(timeout.current)
      timeout.current = setTimeout(later, wait)
    },
    [func, wait]
  )
}
