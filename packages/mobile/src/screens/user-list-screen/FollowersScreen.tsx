import { useCurrentUserId, useFollowers } from '@audius/common/api'
import { ChatBlastAudience } from '@audius/sdk'

import { Box, IconUserFollowers } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastWithAudienceCTA'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Followers'
}

export const FollowersScreen = () => {
  const { params } = useProfileRoute<'Followers'>()
  const { userId } = params
  const { data: currentUserId } = useCurrentUserId()

  const query = useFollowers({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserFollowers}>
      <>
        <UserList {...query} tag='FOLLOWERS' />
        {currentUserId === userId ? (
          <Box w='100%' style={{ position: 'absolute', bottom: 0 }}>
            <ChatBlastWithAudienceCTA audience={ChatBlastAudience.FOLLOWERS} />
          </Box>
        ) : null}
      </>
    </UserListScreen>
  )
}
