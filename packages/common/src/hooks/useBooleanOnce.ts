import { useRef } from 'react'

/** Helper hook which will return the passed value on first render and a default
 * value on subsequent renders. Both values default to `false`.
 */
export const useBooleanOnce = ({
  initialValue = false,
  defaultValue = false
}) => {
  const ref = useRef(initialValue)
  const value = ref.current
  ref.current = defaultValue
  return value
}
