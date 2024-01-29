import { useCallback } from 'react'

import {
  supportingUserListActions,
  supportingUserListSelectors
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { IconTip } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { getUserList } = supportingUserListSelectors
const { setSupporting } = supportingUserListActions

const messages = {
  title: 'Supporting'
}

export const SupportingUsersScreen = () => {
  const { params } = useRoute<'SupportingUsers'>()
  const { userId } = params
  const dispatch = useDispatch()

  const handleSetSupporting = useCallback(() => {
    dispatch(setSupporting(userId))
  }, [dispatch, userId])

  return (
    <UserListScreen title={messages.title} titleIcon={IconTip}>
      <UserList
        userSelector={getUserList}
        tag='SUPPORTING'
        setUserList={handleSetSupporting}
      />
    </UserListScreen>
  )
}
