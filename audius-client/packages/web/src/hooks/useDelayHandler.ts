import { useState } from 'react'

import { isEqual } from 'lodash'

/**
 * `useDelayHandler` allows you to temporarily delay the firing of some handler (e.g. delaying a callback
 * that performs some expensive computation that would cause a click animation to lag). It accepts arbitrary
 * props, which can be temporarily overwritten in the call to the returned `delayedHandler`.
 *
 * Example usage: delaying a call that sets a count variable
 *
 *  const { setCount, count } = props
 *
 *  // Get the new handler and state
 *  const { delayedHandler, computedState } = useDelayHandler(200, setCount, { count })
 *
 *  render() {
 *    // Pass the computed count in to render
 *    <div> Count: `${computedState.count}` </div>
 *
 *    // Use the delayed handler, passing in the optimistically set count, and then the actual argument
 *    // to the original handler.
 *    <button onClick={() => { delayedHandler({ count: count + 1 }, count + 1 )}}> Increment count </button>
 *  }
 *
 * @template T the type of the injected props
 * @param {number} delay delay in MS
 * @param {(...args: any[]) => void} handler
 * @param {T} injectedProps state to temporarily overwrite during delayed handler call.
 * @returns
 */
const useDelayHandler = <T>(
  delay: number,
  handler: (...args: any[]) => void,
  injectedProps: T
) => {
  const [allowOverwrite, setAllowOverwrite] = useState(true)
  const [overwrittenValues, setOverwrittenValues] = useState<T>(injectedProps)

  if (allowOverwrite && !isEqual(overwrittenValues, injectedProps))
    setOverwrittenValues(injectedProps)

  return {
    delayedHandler: (newState: Partial<T>, ...args: any) => {
      setAllowOverwrite(false)
      setOverwrittenValues((v) => ({ ...v, ...newState }))
      setTimeout(() => {
        handler(...args)
        setAllowOverwrite(true)
      }, delay)
    },
    computedState: overwrittenValues
  }
}

export default useDelayHandler
