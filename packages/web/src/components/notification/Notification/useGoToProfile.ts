import { useCallback } from 'react'

import { User } from '@audius/common/models'
import { Nullable, route } from '@audius/common/utils'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

const { profilePage } = route

export const useGoToProfile = (user: Nullable<User> | undefined) => {
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (!user) return
    dispatch(push(profilePage(user.handle)))
  }, [dispatch, user])

  return handleClick
}
