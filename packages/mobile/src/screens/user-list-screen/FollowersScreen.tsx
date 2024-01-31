import { useCallback } from 'react'

import {
  followersUserListActions,
  followersUserListSelectors
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import IconUserFollowers from 'app/assets/images/iconUserFollowers.svg'
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
    <UserListScreen title={messages.title} titleIcon={IconUserFollowers}>
      <UserList
        userSelector={getUserList}
        tag='FOLLOWERS'
        setUserList={handleSetFollowers}
      />
    </UserListScreen>
  )
}
