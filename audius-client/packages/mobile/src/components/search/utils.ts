import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { usePushRouteWeb } from '../../hooks/usePushRouteWeb'
import * as searchActions from '../../store/search/actions'

export const usePushSearchRoute = () => {
  const dispatch = useDispatch()
  const onClose = useCallback(() => dispatch(searchActions.close()), [dispatch])
  const pushWebRoute = usePushRouteWeb(onClose)
  return pushWebRoute
}
