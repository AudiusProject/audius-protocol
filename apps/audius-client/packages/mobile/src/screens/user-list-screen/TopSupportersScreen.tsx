import { useCallback } from 'react'

import { setTopSupporters } from 'audius-client/src/common/store/user-list/top-supporters/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/top-supporters/selectors'

import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListTitle } from './UserListTitle'

const messages = {
  title: 'Top Supporters'
}

const headerTitle = () => (
  <UserListTitle icon={IconTrophy} title={messages.title} />
)

export const TopSupportersScreen = () => {
  const { params } = useRoute<'TopSupporters'>()
  const { userId } = params
  const dispatchWeb = useDispatchWeb()

  const handleSetSupporters = useCallback(() => {
    dispatchWeb(setTopSupporters(userId))
  }, [dispatchWeb, userId])

  return (
    <Screen headerTitle={headerTitle} variant='white'>
      <UserList
        userSelector={getUserList}
        tag='TOP SUPPORTERS'
        setUserList={handleSetSupporters}
      />
    </Screen>
  )
}
