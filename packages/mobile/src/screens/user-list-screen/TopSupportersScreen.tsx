import { useCurrentUserId, useSupporters } from '@audius/common/api'
import { ChatBlastAudience } from '@audius/sdk'
import { css } from '@emotion/native'

import { Box, IconTrophy } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastWithAudienceCTA'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

const messages = {
  title: 'Top Supporters'
}

export const TopSupportersScreen = () => {
  const { params } = useRoute<'TopSupporters'>()
  const { userId } = params
  const { data: currentUserId } = useCurrentUserId()
  const query = useSupporters({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconTrophy}>
      <>
        <UserListV2 {...query} tag='TOP SUPPORTERS' />
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
