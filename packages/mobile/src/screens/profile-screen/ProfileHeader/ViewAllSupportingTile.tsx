import { useCallback } from 'react'

import { cacheUsersSelectors } from '@audius/common'
import {
  useRankedSupportingForUser,
  useProxySelector
} from '@audius/common/hooks'
import { formatCount, MAX_PROFILE_SUPPORTING_TILES } from '@audius/common/utils'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Tile, TextButton } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { ProfilePictureList } from 'app/screens/notifications-screen/Notification'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'
const { getUsers } = cacheUsersSelectors

const MAX_PROFILE_SUPPORTING_VIEW_ALL_USERS = 6

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(2),
    marginHorizontal: spacing(1)
  },
  content: {
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    height: 88
  },
  profilePictureList: {
    marginBottom: spacing(3),
    marginRight: spacing(2)
  }
}))

const messages = {
  viewAll: 'View All'
}

const formatViewAllMessage = (count: number) => {
  return `${messages.viewAll} ${formatCount(count)}`
}

export const ViewAllSupportingTile = () => {
  const styles = useStyles()
  const navigation = useNavigation()

  const { user_id, supporting_count } = useSelectProfile([
    'user_id',
    'supporting_count'
  ])

  const rankedSupportingList = useRankedSupportingForUser(user_id)

  const rankedSupportingUsers = useProxySelector(
    (state) => {
      const rankedIds = rankedSupportingList.map((s) => s.receiver_id)
      const usersMap = getUsers(state, {
        ids: rankedIds
      })
      return rankedIds.map((id) => usersMap[id]).filter(Boolean)
    },
    [rankedSupportingList]
  )

  const handlePress = useCallback(() => {
    navigation.push('SupportingUsers', { userId: user_id })
  }, [navigation, user_id])

  const viewAllString = formatViewAllMessage(supporting_count)

  return (
    <Tile
      styles={{
        root: styles.root,
        content: styles.content
      }}
      onPress={handlePress}
    >
      <ProfilePictureList
        users={rankedSupportingUsers.slice(MAX_PROFILE_SUPPORTING_TILES)}
        limit={MAX_PROFILE_SUPPORTING_VIEW_ALL_USERS}
        style={styles.profilePictureList}
        navigationType='push'
        interactive={false}
      />
      <TextButton
        disabled
        showDisabled={false}
        variant='neutralLight4'
        icon={IconArrow}
        iconPosition='right'
        title={viewAllString}
        TextProps={{ fontSize: 'small', weight: 'bold' }}
      />
    </Tile>
  )
}
