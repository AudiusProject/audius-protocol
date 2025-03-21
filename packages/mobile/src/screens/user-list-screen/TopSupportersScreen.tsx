import { useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import {
  cacheUsersSelectors,
  topSupportersUserListActions,
  topSupportersUserListSelectors
} from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { css } from '@emotion/native'
import { Platform, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Box, IconTrophy } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastWithAudienceCTA'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { setTopSupporters } = topSupportersUserListActions
const { getUserList, getId: getSupportersId } = topSupportersUserListSelectors
const { getUser } = cacheUsersSelectors

const messages = {
  title: 'Tip Supporters',
  titleAlt: 'Top Supporters'
}

const useStyles = makeStyles(({ spacing }) => ({
  titleNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -spacing(3)
  },
  titleName: {
    maxWidth: 120
  }
}))

export const TopSupportersScreen = () => {
  const styles = useStyles()
  const { params } = useRoute<'TopSupporters'>()
  const { userId, source } = params
  const { data: currentUserId } = useGetCurrentUserId({})
  const supportersId = useSelector(getSupportersId)
  const supportersUser = useSelector((state) =>
    getUser(state, { id: supportersId })
  )
  const baseTitle = Platform.OS === 'ios' ? messages.titleAlt : messages.title
  const dispatch = useDispatch()

  const handleSetSupporters = useCallback(() => {
    dispatch(setTopSupporters(userId))
  }, [dispatch, userId])

  const title =
    source === 'feed' && supportersUser ? (
      <View style={styles.titleNameContainer}>
        <Text variant='h3' style={styles.titleName} numberOfLines={1}>
          {supportersUser.name}
        </Text>
        <Text variant='h3'>&apos;s&nbsp;{baseTitle}</Text>
      </View>
    ) : (
      baseTitle
    )

  return (
    <UserListScreen title={title} titleIcon={IconTrophy}>
      <>
        <UserList
          userSelector={getUserList}
          tag='TOP SUPPORTERS'
          setUserList={handleSetSupporters}
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
