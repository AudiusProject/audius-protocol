import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'

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
      dispatch(pushRoute(route))
    },
    [dispatch]
  )
}
