import { useCurrentUserId, useSupporters, useUser } from '@audius/common/api'
import { ChatBlastAudience } from '@audius/sdk'
import { css } from '@emotion/native'

import { Box, IconTrophy } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastWithAudienceCTA'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Top Supporters'
}

export const TopSupportersScreen = () => {
  const { params } = useRoute<'TopSupporters'>()
  const { userId } = params

  const { data: supporterCount } = useUser(userId, {
    select: (user) => user.supporter_count
  })

  const { data: currentUserId } = useCurrentUserId()
  const { data, isFetchingNextPage, isPending, fetchNextPage } = useSupporters({
    userId
  })

  return (
    <UserListScreen title={messages.title} titleIcon={IconTrophy}>
      <>
        <UserList
          data={data?.map((supporter) => supporter.sender.user_id)}
          totalCount={supporterCount}
          isFetchingNextPage={isFetchingNextPage}
          isPending={isPending}
          fetchNextPage={fetchNextPage}
          tag='TOP SUPPORTERS'
        />
        {currentUserId === userId ? (
          <Box
            style={css({
              position: 'absolute',
              bottom: 0,
              width: '100%'
            })}
          >
            <ChatBlastWithAudienceCTA audience={ChatBlastAudience.TIPPERS} />
          </Box>
        ) : null}
      </>
    </UserListScreen>
  )
}
