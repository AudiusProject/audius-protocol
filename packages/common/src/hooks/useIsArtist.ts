import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { useUserByParams } from '~/api'
import { useCurrentAccount } from '~/api/tan-query/users/account/useCurrentAccount'
import { ID } from '~/models'
import { accountActions } from '~/store/account'

const { fetchHasTracks } = accountActions

export const useIsArtist = (params: { id?: ID; handle?: string }) => {
  const { data: user } =
    useUserByParams(params, {
      select: (user) => ({
        user_id: user.user_id,
        track_count: user.track_count
      })
    }) ?? {}
  const { user_id, track_count } = user ?? {}

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
