import { useState, useRef, useEffect } from 'react'

/**
 * `useScrollLock` will prevent the root app div from scrolling. This is useful for modals, or for presenting
 * full screen pages on top of the existing app.
 */
export const useScrollLock = (
  lock: boolean,
  increment: () => void,
  decrement: () => void
) => {
  const isLocked = useRef(lock)
  const [previousLockVal, setPreviousLockVal] = useState<boolean | null>(null)

  const isNewLockVal = lock !== previousLockVal && previousLockVal !== null
  const isFirstLock = lock && previousLockVal === null

  if (isNewLockVal || isFirstLock) {
    setPreviousLockVal(lock)

    if (lock) {
      increment()
    } else {
      decrement()
    }
  }

  useEffect(() => {
    isLocked.current = lock
  }, [lock])

  useEffect(
    () => () => {
      if (isLocked.current) {
        decrement()
      }
    },
    [decrement]
  )
}
