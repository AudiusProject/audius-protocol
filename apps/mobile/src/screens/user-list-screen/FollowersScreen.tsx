import { useCallback } from 'react'

import {
  followersUserListSelectors,
  followersUserListActions
} from '@audius/common'
import { useDispatch } from 'react-redux'

import IconUser from 'app/assets/images/iconUser.svg'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { setFollowers } = followersUserListActions
const { getUserList } = followersUserListSelectors

const messages = {
  title: 'Followers'
}

export const FollowersScreen = () => {
  const { params } = useProfileRoute<'Followers'>()
  const { userId } = params
  const dispatch = useDispatch()

  const handleSetFollowers = useCallback(() => {
    dispatch(setFollowers(userId))
  }, [dispatch, userId])

  return (
    <UserListScreen title={messages.title} titleIcon={IconUser}>
      <UserList
        userSelector={getUserList}
        tag='FOLLOWERS'
        setUserList={handleSetFollowers}
      />
    </UserListScreen>
  )
}
