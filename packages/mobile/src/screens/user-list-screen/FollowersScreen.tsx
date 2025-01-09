import { useCurrentUserId, useFollowers } from '@audius/common/api'
import { ChatBlastAudience } from '@audius/sdk'
import { css } from '@emotion/native'

import { Box, IconUserFollowers } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastWithAudienceCTA'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

const messages = {
  title: 'Followers'
}

export const FollowersScreen = () => {
  const { params } = useProfileRoute<'Followers'>()
  const { userId } = params
  const { data: currentUserId } = useCurrentUserId()

  const { data, hasMore, isLoadingMore, loadMore, isLoading } = useFollowers({
    userId,
    limit: 15
  })

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserFollowers}>
      <>
        <UserListV2
          data={data}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isLoading={isLoading}
          loadMore={loadMore}
          tag='FOLLOWERS'
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
