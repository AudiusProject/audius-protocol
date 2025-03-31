import { useCallback } from 'react'

import { User } from '@audius/common/models'
import { Nullable, route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'

const { profilePage } = route

export const useGoToProfile = (user: Nullable<User> | undefined) => {
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (!user) return
    dispatch(push(profilePage(user.handle)))
  }, [dispatch, user])

  return handleClick
}
