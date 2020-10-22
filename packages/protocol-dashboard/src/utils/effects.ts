import { useDispatch } from 'react-redux'
import { push as pushRoute, goBack, replace } from 'connected-react-router'
import { useCallback } from 'react'

export const usePushRoute = () => {
  const dispatch = useDispatch()
  return useCallback((route: string) => dispatch(pushRoute(route)), [dispatch])
}

export const useBackRoute = () => {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(goBack()), [dispatch])
}

export const useReplaceRoute = () => {
  const dispatch = useDispatch()
  return useCallback((route: string) => dispatch(replace(route)), [dispatch])
}
