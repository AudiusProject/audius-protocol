import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { usePushWebRoute } from '../../hooks/useWebAction'
import * as searchActions from '../../store/search/actions'

export const usePushSearchRoute = () => {
  const dispatch = useDispatch()
  const onClose = useCallback(() => dispatch(searchActions.close()), [dispatch])
  const pushWebRoute = usePushWebRoute(onClose)
  return pushWebRoute
}
