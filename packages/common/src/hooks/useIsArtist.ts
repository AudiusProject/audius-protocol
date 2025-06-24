import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { useCurrentAccount } from '~/api/tan-query/users/account/useCurrentAccount'
import { useProfileUser } from '~/api/tan-query/users/useProfileUser'
import { accountActions } from '~/store/account'

const { fetchHasTracks } = accountActions

export const useIsArtist = () => {
  const { user_id, track_count } =
    useProfileUser({
      select: (user) => ({
        user_id: user.user_id,
        track_count: user.track_count
      })
    }).user ?? {}

  const { data: account } = useCurrentAccount()
  const currentUserId = account?.userId
  const hasTracks = account?.hasTracks

  const dispatch = useDispatch()

  useEffect(() => {
    if (!hasTracks && currentUserId === user_id) {
      dispatch(fetchHasTracks())
    }
  }, [hasTracks, currentUserId, user_id, dispatch])

  return Boolean(
    (user_id === currentUserId && hasTracks) || (track_count && track_count > 0)
  )
}
