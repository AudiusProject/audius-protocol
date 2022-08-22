import { useCallback } from 'react'

import {
  followersUserListSelectors,
  followersUserListActions
} from '@audius/common'

import IconUser from 'app/assets/images/iconUser.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
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
  const dispatchWeb = useDispatchWeb()

  const handleSetFollowers = useCallback(() => {
    dispatchWeb(setFollowers(userId))
  }, [dispatchWeb, userId])

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
