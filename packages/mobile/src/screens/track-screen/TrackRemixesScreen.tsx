import { useCallback } from 'react'

import { useTrackByParams, useRemixes } from '@audius/common/api'
import { remixesPageLineupActions } from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { Text, View } from 'react-native'

import { IconRemix } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { flexRowCentered, makeStyles } from 'app/styles'

const messages = {
  remix: 'Remix',
  of: 'of',
  by: 'by',
  header: 'Remixes'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  header: {
    alignItems: 'center',
    margin: spacing(4),
    marginTop: spacing(6)
  },
  track: {
    ...flexRowCentered()
  },
  text: {
    ...typography.body,
    color: palette.neutral,
    textAlign: 'center',
    lineHeight: 20
  },
  link: {
    color: palette.secondary
  }
}))

export const TrackRemixesScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { params } = useRoute<'TrackRemixes'>()
  const { data: track } = useTrackByParams(params)
  const trackId = track?.track_id
  const { lineup, loadNextPage, pageSize } = useRemixes({ trackId })

  const handlePressTrack = useCallback(() => {
    if (!trackId) {
      return
    }
    navigation.push('Track', { trackId })
  }, [navigation, trackId])

  const handlePressArtistName = useCallback(() => {
    if (!track?.user) {
      return
    }

    navigation.push('Profile', { handle: track.user.handle })
  }, [navigation, track])

  const remixesText = pluralize(
    messages.remix,
    lineup?.entries?.length,
    'es',
    !lineup?.entries?.length
  )
  const remixesCountText = `${lineup?.entries?.length || ''} ${remixesText} ${messages.of}`

  return (
    <Screen>
      <ScreenHeader text={messages.header} icon={IconRemix} />
      <ScreenContent>
        <Lineup
          header={
            track && track.user ? (
              <View style={styles.header}>
                <Text style={styles.text}>{remixesCountText}</Text>
                <Text style={styles.text}>
                  <Text style={styles.link} onPress={handlePressTrack}>
                    {track.title}
                  </Text>{' '}
                  <Text>{messages.by}</Text>{' '}
                  <Text onPress={handlePressArtistName}>
                    <Text style={styles.link}>{track.user.name}</Text>
                    {track.user ? (
                      <UserBadges user={track.user} badgeSize={10} hideName />
                    ) : null}
                  </Text>
                </Text>
              </View>
            ) : null
          }
          lineup={lineup}
          loadMore={loadNextPage}
          tanQuery
          pageSize={pageSize}
          actions={remixesPageLineupActions}
        />
      </ScreenContent>
    </Screen>
  )
}
