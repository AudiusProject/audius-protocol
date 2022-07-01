import { useCallback } from 'react'

import { setFollowing } from 'audius-client/src/common/store/user-list/following/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/following/selectors'

import IconUser from 'app/assets/images/iconUser.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Following'
}

export const FollowingScreen = () => {
  const { params } = useProfileRoute<'Following'>()
  const { userId } = params
  const dispatchWeb = useDispatchWeb()

  const handleSetFollowing = useCallback(() => {
    dispatchWeb(setFollowing(userId))
  }, [dispatchWeb, userId])

  return (
    <UserListScreen title={messages.title} titleIcon={IconUser}>
      <UserList
        userSelector={getUserList}
        tag='FOLLOWING'
        setUserList={handleSetFollowing}
      />
    </UserListScreen>
  )
}
