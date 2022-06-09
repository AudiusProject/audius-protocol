import { useEffect, useMemo } from 'react'

declare global {
  interface Window {
    AudiusStems: any
  }
}

window.AudiusStems = window.AudiusStems || {}

/**
 * Hook to "share state" between components using the global window object.
 * Obviously, comes with caveats with globals.
 *
 * @param name shared name between users of a useGlobal
 * @param initialValue
 * @returns getter, setter
 *  Similar to useState, except
 *  1. The getter is a function to allow for fresh fetches (pulls off of window at each invocation)
 *  2. The setter can/should only be invoked with a mutator function rather than a "new value"
 */
export const useGlobal = <T>(
  name: string,
  initialValue: T
): [() => T, (mutator: (cur: T) => void) => void] => {
  useEffect(() => {
    if (window.AudiusStems[name] === undefined) {
      window.AudiusStems[name] = initialValue
    }
  }, [name, initialValue])

  const getter = useMemo(() => () => window.AudiusStems[name], [name])
  const setter = useMemo(
    () => (mutator: (cur: T) => void) => {
      window.AudiusStems[name] = mutator(window.AudiusStems[name])
    },
    [name]
  )

  return [getter, setter]
}
