import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/remixes/lineup/actions'
import {
  getTrack,
  getUser,
  getLineup,
  getCount
} from 'audius-client/src/common/store/pages/remixes/selectors'
import { pluralize } from 'audius-client/src/common/utils/formatUtil'
import { Text, View } from 'react-native'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { flexRowCentered, makeStyles } from 'app/styles'

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
  const lineup = useSelectorWeb(getRemixesTracksLineup)
  const count = useSelectorWeb(getCount)
  const track = useSelectorWeb(getTrack)
  const user = useSelectorWeb(getUser)

  const styles = useStyles()

  const handlePressTrack = () => {
    if (!track) {
      return
    }
    navigation.push({
      native: { screen: 'Track', params: { id: track.track_id } },
      web: { route: track.permalink }
    })
  }

  const handlePressArtistName = () => {
    if (!user) {
      return
    }

    navigation.push({
      native: { screen: 'Profile', params: { handle: user.handle } },
      web: { route: `/${user.handle}` }
    })
  }

  const remixesText = pluralize(messages.remix, count, 'es', !count)
  const remixesCountText = `${count || ''} ${remixesText} ${messages.of}`

  return (
    <Screen>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        fetchPayload={{ trackId: track?.track_id }}
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
