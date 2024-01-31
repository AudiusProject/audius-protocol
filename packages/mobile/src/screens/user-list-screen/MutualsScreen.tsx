import {
  mutualsUserListActions,
  mutualsUserListSelectors,
  MUTUALS_USER_LIST_TAG
} from '@audius/common/store'
import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import IconFollowing from 'app/assets/images/iconFollowing.svg'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { getUserList } = mutualsUserListSelectors
const { setMutuals } = mutualsUserListActions

const messages = {
  title: 'Mutuals'
}

export const MutualsScreen = () => {
  const { params } = useProfileRoute<'Mutuals'>()
  const { userId } = params
  const dispatch = useDispatch()

  const handleSetMutals = useCallback(() => {
    dispatch(setMutuals(userId))
  }, [dispatch, userId])

  return (
    <UserListScreen title={messages.title} titleIcon={IconFollowing}>
      <UserList
        userSelector={getUserList}
        tag={MUTUALS_USER_LIST_TAG}
        setUserList={handleSetMutals}
      />
    </UserListScreen>
  )
}
