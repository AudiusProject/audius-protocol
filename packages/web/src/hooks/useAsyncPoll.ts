import { useEffect, useCallback } from 'react'

import { useInstanceVar } from '@audius/common/hooks'

type UseAsyncPoll = {
  // Call to make (usually an action), doesn't have to be async
  call: () => void
  // Variable to poll for
  variable: any
  // Value to compare to `variable`
  value: any
  // Interval to check variable === value
  interval?: number
}

/**
 * Polls for a variable to equal a value while an async request
 * completes. This is useful in the situation where you would like
 * to dispatch and action, wait for the store to update to some value
 * and then return out of your async function
 *
 * ```
 * const doWork = useAsyncPoll({
 *  call: dispatch(someAction()),
 *  variable: props.status,
 *  value: Status.SUCCESS
 * })
 * ```
 */
const useAsyncPoll = ({
  call,
  variable,
  value,
  interval = 200
}: UseAsyncPoll) => {
  const [isWaiting, setIsWaiting] = useInstanceVar(false)
  useEffect(() => {
    if (variable === value) {
      setIsWaiting(false)
    }
  }, [variable, value, setIsWaiting])

  const fun = useCallback(
    async () =>
      new Promise<void>((resolve) => {
        // Short circuit if they're already equal
        if (variable === value) resolve()

        setIsWaiting(true)
        call()
        const i = setInterval(() => {
          if (!isWaiting()) {
            clearInterval(i)
            resolve()
          }
        }, interval)
      }),
    [call, interval, isWaiting, setIsWaiting, value, variable]
  )
  return fun
}

export default useAsyncPoll
