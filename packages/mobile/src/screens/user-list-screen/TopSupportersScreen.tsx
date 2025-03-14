<<<<<<< HEAD
import { useCallback } from 'react'

import { useCurrentUserId, useGetCurrentUserId, useSupporters } from '@audius/common/api'
import {
  cacheUsersSelectors,
  topSupportersUserListActions,
  topSupportersUserListSelectors
} from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { css } from '@emotion/native'
import { Platform, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
=======
import { useCurrentUserId, useSupporters } from '@audius/common/api'
import { ChatBlastAudience } from '@audius/sdk'
import { css } from '@emotion/native'
>>>>>>> d81215120c ([C-5652] Migrate all user-lists to tan-query (#11025))

import { Box, IconTrophy } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastWithAudienceCTA'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

const messages = {
  title: 'Tip Supporters',
  titleAlt: 'Top Supporters'
}

export const TopSupportersScreen = () => {
  const { params } = useRoute<'TopSupporters'>()
  const { userId } = params
  const { data: currentUserId } = useCurrentUserId()
  const query = useSupporters({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconTrophy}>
      <>
        <UserListV2
          {...query}
          data={query.data?.map((supporter) => supporter.sender)}
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
