import { useCallback } from 'react'

import {
  mutualsUserListActions,
  mutualsUserListSelectors,
  MUTUALS_USER_LIST_TAG
} from '@audius/common'

import IconFollowing from 'app/assets/images/iconFollowing.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
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
  const dispatchWeb = useDispatchWeb()

  const handleSetMutals = useCallback(() => {
    dispatchWeb(setMutuals(userId))
  }, [dispatchWeb, userId])

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
