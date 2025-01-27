import { useCallback } from 'react'

import { useUser, useAiTracks } from '@audius/common/api'
import { aiPageLineupActions } from '@audius/common/store'
import { TouchableOpacity, View } from 'react-native'

import { IconRobot } from '@audius/harmony-native'
import { Text, Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useProfileRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { ShareAiTracksTile } from './ShareAiTracksTile'

const messages = {
  header: 'AI Generated Tracks',
  headerText: 'Tracks generated with AI trained on music by '
}

const iconSize = { height: spacing(6), width: spacing(6) }

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing(7),
    paddingVertical: spacing(3),
    backgroundColor: palette.white
  },
  headerText: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.fontSize.medium * 1.3,
    textAlign: 'left'
  },
  userBadgeTitle: {
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium,
    color: palette.secondary
  }
}))

export const AiGeneratedTracksScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { params } = useProfileRoute<'AiGeneratedTracks'>()
  const { userId } = params
  const { data: user } = useUser(userId)
  const { lineup, loadNextPage, pageSize } = useAiTracks({
    handle: user?.handle
  })

  const handleGoToProfile = useCallback(() => {
    navigation.navigate('Profile', { id: userId })
  }, [navigation, userId])

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconRobot}
        iconProps={iconSize}
      />
      <ScreenContent>
        <Lineup
          header={
            user ? (
              <View style={styles.header}>
                <Text>{messages.headerText}</Text>
                <TouchableOpacity onPress={handleGoToProfile}>
                  <UserBadges user={user} nameStyle={styles.userBadgeTitle} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListFooterComponent={<ShareAiTracksTile />}
          actions={aiPageLineupActions}
          lineup={lineup}
          loadMore={loadNextPage}
          tanQuery
          pageSize={pageSize}
        />
      </ScreenContent>
    </Screen>
  )
}
