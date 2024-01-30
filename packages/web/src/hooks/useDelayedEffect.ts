import { useEffect } from 'react'

import { useInstanceVar } from '@audius/common/hooks'

import {} from '@audius/common'

/**
 * useDelayedEffect invokes a callback after a given delay on the satisfaction
 * of some condition
 * @param callback the callback to invoke when condition is truthy
 * @param reset the callback to invoke when the condition is falsey
 * @param condition the condition to check
 * @param delay how long after the condition changes to invoke the callback
 *
 * Fire a click event after a 1000ms (default) delay
 * ```
 * useDelayedEffect({
 *   callback: () => click(),
 *   condition: isClicked === true
 * })
 * ```
 */
export const useDelayedEffect = ({
  callback,
  reset,
  condition,
  delay = 1000
}: {
  callback: () => void
  reset: () => void
  condition: boolean
  delay: number
}) => {
  const [getTimeoutId, setTimeoutId] = useInstanceVar<ReturnType<
    typeof setTimeout
  > | null>(null)

  useEffect(() => {
    const existingId = getTimeoutId()
    if (existingId) {
      clearTimeout(existingId)
    }

    if (condition) {
      const id = setTimeout(() => {
        callback()
      }, delay)
      setTimeoutId(id)
    } else {
      reset()
    }
  }, [getTimeoutId, setTimeoutId, condition, callback, reset, delay])
}
