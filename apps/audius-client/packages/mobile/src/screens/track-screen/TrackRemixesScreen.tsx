import { useCallback, useEffect } from 'react'

import {
  pluralize,
  lineupSelectors,
  remixesPageLineupActions as tracksActions,
  remixesPageSelectors,
  remixesPageActions
} from '@audius/common'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
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

  const styles = useStyles()
  const { params } = useRoute<'TrackRemixes'>()

  const trackId = params.id
  useEffect(() => {
    dispatch(fetchTrack({ id: trackId }))
    dispatch(
      tracksActions.fetchLineupMetadatas(0, 10, false, {
        trackId: trackId ?? null
      })
    )
    return function cleanup() {
      dispatch(reset())
      dispatch(tracksActions.reset())
    }
  }, [dispatch, trackId])

  const handlePressTrack = () => {
    if (!track) {
      return
    }
    navigation.push({
      native: { screen: 'Track', params: { id: trackId } }
    })
  }

  const handlePressArtistName = () => {
    if (!user) {
      return
    }

    navigation.push({
      native: { screen: 'Profile', params: { handle: user.handle } }
    })
  }

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, overwrite, {
          trackId: trackId ?? null
        })
      )
    },
    [dispatch, trackId]
  )

  const remixesText = pluralize(messages.remix, count, 'es', !count)
  const remixesCountText = `${count || ''} ${remixesText} ${messages.of}`

  return (
    <Screen>
      <Header text={messages.header} />
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
    </Screen>
  )
}
