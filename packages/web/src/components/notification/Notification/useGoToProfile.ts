import { useCallback } from 'react'

import { Nullable } from '@audius/common'
import { User } from '@audius/common/models'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { profilePage } from 'utils/route'

export const useGoToProfile = (user: Nullable<User> | undefined) => {
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (!user) return
    dispatch(push(profilePage(user.handle)))
  }, [dispatch, user])

  return handleClick
}
