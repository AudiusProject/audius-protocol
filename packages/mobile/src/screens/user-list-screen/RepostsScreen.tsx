import { useCallback } from 'react'

import {
  repostsUserListActions,
  repostsUserListSelectors
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { IconRepost } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { setRepost } = repostsUserListActions
const { getUserList } = repostsUserListSelectors

const messages = {
  title: 'Reposts'
}

export const RepostsScreen = () => {
  const { params } = useRoute<'Reposts'>()
  const { id, repostType } = params
  const dispatch = useDispatch()

  const handleSetRepost = useCallback(() => {
    dispatch(setRepost(id, repostType))
  }, [dispatch, id, repostType])

  return (
    <UserListScreen title={messages.title} titleIcon={IconRepost}>
      <UserList
        userSelector={getUserList}
        tag='REPOSTS'
        setUserList={handleSetRepost}
      />
    </UserListScreen>
  )
}
