import { useCallback, useEffect } from 'react'

import {
  lineupSelectors,
  remixesPageLineupActions as tracksActions,
  remixesPageActions,
  remixesPageSelectors
} from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { flexRowCentered, makeStyles } from 'app/styles'

const { getTrack, getUser, getLineup, getCount } = remixesPageSelectors
const { fetchTrack, reset } = remixesPageActions
const { makeGetLineupMetadatas } = lineupSelectors

const getRemixesTracksLineup = makeGetLineupMetadatas(getLineup)

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
  const navigation = useNavigation()
  const lineup = useSelector(getRemixesTracksLineup)
  const count = useSelector(getCount)
  const track = useSelector(getTrack)
  const user = useSelector(getUser)
  const dispatch = useDispatch()
  const trackId = track?.track_id

  const styles = useStyles()
  const { params } = useRoute<'TrackRemixes'>()

  useEffectOnce(() => {
    dispatch(fetchTrack(params))
  })

  useEffect(() => {
    if (trackId) {
      dispatch(
        tracksActions.fetchLineupMetadatas(0, 10, false, {
          trackId
        })
      )

      return function cleanup() {
        dispatch(reset())
        dispatch(tracksActions.reset())
      }
    }
  }, [dispatch, trackId])

  const handlePressTrack = () => {
    if (!track) {
      return
    }
    navigation.push('Track', { id: trackId })
  }

  const handlePressArtistName = () => {
    if (!user) {
      return
    }

    navigation.push('Profile', { handle: user.handle })
  }

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      if (trackId) {
        dispatch(
          tracksActions.fetchLineupMetadatas(offset, limit, overwrite, {
            trackId
          })
        )
      }
    },
    [dispatch, trackId]
  )

  const remixesText = pluralize(messages.remix, count, 'es', !count)
  const remixesCountText = `${count || ''} ${remixesText} ${messages.of}`

  return (
    <Screen>
      <ScreenHeader text={messages.header} icon={IconRemix} />
      <ScreenContent>
        <Lineup
          lineup={lineup}
          loadMore={loadMore}
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
