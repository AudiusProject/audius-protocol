import { useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import {
  followersUserListActions,
  followersUserListSelectors
} from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { Box, IconUserFollowers } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { ChatBlastWithAudienceCTA } from '../chat-screen/ChatBlastFollowersCTA'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { setFollowers } = followersUserListActions
const { getUserList } = followersUserListSelectors

const messages = {
  title: 'Followers'
}

const useStyles = makeStyles(() => ({
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%'
  }
}))

export const FollowersScreen = () => {
  const { params } = useProfileRoute<'Followers'>()
  const { userId } = params
  const { data: currentUserId } = useGetCurrentUserId({})
  const dispatch = useDispatch()

  const styles = useStyles()

  const handleSetFollowers = useCallback(() => {
    dispatch(setFollowers(userId))
  }, [dispatch, userId])
  const { isEnabled: isOneToManyDMsEnabled } = useFeatureFlag(
    FeatureFlags.ONE_TO_MANY_DMS
  )

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserFollowers}>
      <>
        <UserList
          userSelector={getUserList}
          tag='FOLLOWERS'
          setUserList={handleSetFollowers}
        />
        {isOneToManyDMsEnabled && currentUserId === userId ? (
          <Box style={styles.footerContainer}>
            <ChatBlastWithAudienceCTA audience={ChatBlastAudience.FOLLOWERS} />
          </Box>
        ) : null}
      </>
    </UserListScreen>
  )
}
