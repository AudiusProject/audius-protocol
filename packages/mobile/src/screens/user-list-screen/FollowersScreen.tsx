import { useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import {
  followersUserListActions,
  followersUserListSelectors
} from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { css } from '@emotion/native'
import { useDispatch } from 'react-redux'

import { Box, IconUserFollowers } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastWithAudienceCTA'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { setFollowers } = followersUserListActions
const { getUserList } = followersUserListSelectors

const messages = {
  title: 'Followers'
}

export const FollowersScreen = () => {
  const { params } = useProfileRoute<'Followers'>()
  const { userId } = params
  const { data: currentUserId } = useGetCurrentUserId({})
  const dispatch = useDispatch()

  const handleSetFollowers = useCallback(() => {
    dispatch(setFollowers(userId))
  }, [dispatch, userId])

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserFollowers}>
      <>
        <UserList
          userSelector={getUserList}
          tag='FOLLOWERS'
          setUserList={handleSetFollowers}
        />
        {currentUserId === userId ? (
          <Box
            style={css({
              position: 'absolute',
              bottom: 0,
              width: '100%'
            })}
          >
            <ChatBlastWithAudienceCTA audience={ChatBlastAudience.FOLLOWERS} />
          </Box>
        ) : null}
      </>
    </UserListScreen>
  )
}
