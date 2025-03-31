import { useCallback } from 'react'

import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

/**
 * Wraps page navigation.
 * Usage:
 * ```
 *  const navigate = useNavigateToPage()
 *  ...
 *  navigate(SETTINGS_PAGE)
 * ```
 */
export const useNavigateToPage = () => {
  const dispatch = useDispatch()
  return useCallback(
    (route: string) => {
      dispatch(push(route))
    },
    [dispatch]
  )
}
