import { useCallback } from 'react'

import type { SupportedUserMetadata } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'

import { IconArrowRight, PlainButton } from '@audius/harmony-native'
import { Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { ProfilePictureList } from 'app/screens/notifications-screen/Notification'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

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

type ViewAllSupportingTileProps = {
  supportedUsers: SupportedUserMetadata[]
}

export const ViewAllSupportingTile = ({
  supportedUsers
}: ViewAllSupportingTileProps) => {
  const styles = useStyles()
  const navigation = useNavigation()

  const { user_id, supporting_count } = useSelectProfile([
    'user_id',
    'supporting_count'
  ])

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
        users={supportedUsers.map((user) => user.receiver)}
        limit={MAX_PROFILE_SUPPORTING_VIEW_ALL_USERS}
        style={styles.profilePictureList}
        navigationType='push'
        interactive={false}
      />
      <PlainButton
        variant='subdued'
        iconRight={IconArrowRight}
        onPress={handlePress}
      >
        {viewAllString}
      </PlainButton>
    </Tile>
  )
}
