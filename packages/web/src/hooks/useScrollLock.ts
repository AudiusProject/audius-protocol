import { useState, useRef, useEffect } from 'react'

/**
 * `useScrollLock` will prevent the root app div from scrolling. This is useful for modals, or for presenting
 * full screen pages on top of the existing app (e.g. in SignOn).
 *
 * Beacuse useScrollLock may be called from multiple components simultaneously, in order to prevent brittle code
 * and race conditions we use the Redux store to keep a count of attempts to lock vs unlock,
 * and only lock the app when the count > 0.
 *
 */
const useScrollLock = (
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

export default useScrollLock
