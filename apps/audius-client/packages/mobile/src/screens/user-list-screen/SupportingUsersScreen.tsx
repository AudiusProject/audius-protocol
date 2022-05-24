import { useCallback } from 'react'

import { setSupporting } from 'audius-client/src/common/store/user-list/supporting/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/supporting/selectors'

import IconTip from 'app/assets/images/iconTip.svg'
import { Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListTitle } from './UserListTitle'

const messages = {
  title: 'Supporting'
}

const headerTitle = () => (
  <UserListTitle icon={IconTip} title={messages.title} />
)

export const SupportingUsersScreen = () => {
  const { params } = useRoute<'SupportingUsers'>()
  const { userId } = params
  const dispatchWeb = useDispatchWeb()

  const handleSetSupporting = useCallback(() => {
    dispatchWeb(setSupporting(userId))
  }, [dispatchWeb, userId])

  return (
    <Screen headerTitle={headerTitle} variant='white'>
      <UserList
        userSelector={getUserList}
        tag='SUPPORTING'
        setUserList={handleSetSupporting}
      />
    </Screen>
  )
}
