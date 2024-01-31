import { useCallback } from 'react'

import {
  supportingUserListActions,
  supportingUserListSelectors
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import IconTip from 'app/assets/images/iconTip.svg'
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
