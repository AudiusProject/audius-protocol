import { useCallback } from 'react'

import { setFollowers } from 'audius-client/src/common/store/user-list/followers/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/followers/selectors'

import IconUser from 'app/assets/images/iconUser.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

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
