import { useCallback } from 'react'

import { setRepost } from 'audius-client/src/common/store/user-list/reposts/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/reposts/selectors'

import { Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'

const messages = {
  title: 'Reposts'
}

export const RepostsScreen = () => {
  const { params } = useRoute<'Reposts'>()
  const { id, repostType } = params
  const dispatchWeb = useDispatchWeb()

  const handleSetRepost = useCallback(() => {
    dispatchWeb(setRepost(id, repostType))
  }, [dispatchWeb, id, repostType])

  return (
    <Screen title={messages.title} variant='secondary'>
      <UserList
        userSelector={getUserList}
        tag='REPOSTS'
        setUserList={handleSetRepost}
      />
    </Screen>
  )
}
