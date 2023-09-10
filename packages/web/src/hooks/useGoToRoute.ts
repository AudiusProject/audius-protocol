import { useCallback } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

export function useGoToRoute() {
  const dispatch = useDispatch()
  return useCallback((route: string) => dispatch(pushRoute(route)), [dispatch])
}
