import { useCallback } from 'react'

import { setMutuals } from 'audius-client/src/common/store/user-list/mutuals/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/mutuals/selectors'
import { USER_LIST_TAG } from 'audius-client/src/common/store/user-list/mutuals/types'

import { Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'

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
    <Screen title={messages.title} variant='white'>
      <UserList
        userSelector={getUserList}
        tag={USER_LIST_TAG}
        setUserList={handleSetMutals}
      />
    </Screen>
  )
}
