import { useEffect } from 'react'

import { useRemixes, useTrackByParams, useUser } from '@audius/common/api'
import {
  remixesPageLineupActions as tracksActions,
  remixesPageActions,
  remixesPageSelectors
} from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconRemix } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { flexRowCentered, makeStyles } from 'app/styles'

const { getCount } = remixesPageSelectors
const { fetchTrackSucceeded } = remixesPageActions

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
  const { params } = useRoute<'TrackRemixes'>()

  const navigation = useNavigation()
  const count = useSelector(getCount)
  const dispatch = useDispatch()

  const { data: track } = useTrackByParams(params)
  const trackId = track?.track_id
  const { data: user } = useUser(track?.owner_id)
  const { lineup, loadNextPage } = useRemixes({ trackId })

  useEffect(() => {
    if (trackId) {
      dispatch(fetchTrackSucceeded({ trackId }))
      dispatch(
        tracksActions.fetchLineupMetadatas(0, 10, false, {
          trackId
        })
      )

      return function cleanup() {
        dispatch(tracksActions.reset())
      }
    }
  }, [dispatch, trackId])

  const handlePressTrack = () => {
    if (!track) {
      return
    }
    navigation.push('Track', { id: track.track_id })
  }

  const handlePressArtistName = () => {
    if (!user) {
      return
    }

    navigation.push('Profile', { handle: user.handle })
  }

  const remixesText = pluralize(messages.remix, count, 'es', !count)
  const remixesCountText = `${count || ''} ${remixesText} ${messages.of}`

  return (
    <Screen>
      <ScreenHeader text={messages.header} icon={IconRemix} />
      <ScreenContent>
        <Lineup
          tanQuery
          lineup={lineup}
          loadMore={loadNextPage}
          header={
            track && user ? (
              <View style={styles.header}>
                <Text style={styles.text}>{remixesCountText}</Text>
                <Text style={styles.text}>
                  <Text style={styles.link} onPress={handlePressTrack}>
                    {track.title}
                  </Text>{' '}
                  <Text>{messages.by}</Text>{' '}
                  <Text onPress={handlePressArtistName}>
                    <Text style={styles.link}>{user.name}</Text>
                    {user ? (
                      <UserBadges user={user} badgeSize={10} hideName />
                    ) : null}
                  </Text>
                </Text>
              </View>
            ) : null
          }
          actions={tracksActions}
        />
      </ScreenContent>
    </Screen>
  )
}
