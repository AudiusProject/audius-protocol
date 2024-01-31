import { accountActions, accountSelectors } from '@audius/common/store'
import { useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { useSelectProfile } from './selectors'

const { fetchHasTracks } = accountActions
const { getUserId, getAccountHasTracks } = accountSelectors

export const useIsArtist = () => {
  const { user_id, track_count } = useSelectProfile(['user_id', 'track_count'])
  const accountHasTracks = useSelector(getAccountHasTracks)
  const currentUserId = useSelector(getUserId)
  const dispatch = useDispatch()

  useEffect(() => {
    if (accountHasTracks === null && currentUserId === user_id) {
      dispatch(fetchHasTracks())
    }
  }, [accountHasTracks, currentUserId, user_id, dispatch])

  return (user_id === currentUserId && accountHasTracks) || track_count > 0
}
