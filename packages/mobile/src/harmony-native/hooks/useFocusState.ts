import { useState, useCallback } from 'react'

import type { NativeSyntheticEvent } from 'react-native'

/**
 * Used to track focus state of an element
 *
 * To use:
 * - Pass in other handlers wanted for focus and blur as appropriate
 * - Assign handleFocus to the onFocus of the element
 * - Assign handleBlur to the onBlur of the element
 *
 * @param onFocus The existing onFocus handler, if any, to wrap
 * @param onBlur The existing onBlur handler, if any, to wrap
 * @returns [isFocused, handleFocus, handleBlur]
 */
export const useFocusState = <T>(
  onFocus?: (e: NativeSyntheticEvent<T>) => void,
  onBlur?: (e: NativeSyntheticEvent<T>) => void
) => {
  const [isFocused, setIsFocused] = useState(false)
  const handleFocus = useCallback(
    (e: NativeSyntheticEvent<T>) => {
      setIsFocused(true)
      onFocus?.(e)
    },
    [onFocus, setIsFocused]
  )
  const handleBlur = useCallback(
    (e: NativeSyntheticEvent<T>) => {
      setIsFocused(false)
      onBlur?.(e)
    },
    [onBlur, setIsFocused]
  )

  return [isFocused, handleFocus, handleBlur] as const
}
