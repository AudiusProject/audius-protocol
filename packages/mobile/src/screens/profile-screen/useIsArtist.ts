import { useEffect } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
import { accountActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { useSelectProfile } from './selectors'

const { fetchHasTracks } = accountActions

export const useIsArtist = () => {
  const { user_id, track_count } = useSelectProfile(['user_id', 'track_count'])
  const { data: accountData } = useCurrentAccountUser({
    select: (user) => ({
      userId: user?.user_id,
      hasTracks: (user?.track_count ?? 0) > 0
    })
  })
  const { userId: currentUserId, hasTracks } = accountData ?? {}
  const dispatch = useDispatch()

  useEffect(() => {
    if (!hasTracks && currentUserId === user_id) {
      dispatch(fetchHasTracks())
    }
  }, [hasTracks, currentUserId, user_id, dispatch])

  return (user_id === currentUserId && hasTracks) || track_count > 0
}
