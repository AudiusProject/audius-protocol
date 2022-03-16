import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/remixes/lineup/actions'
import {
  getTrack,
  getUser,
  getLineup,
  getCount
} from 'audius-client/src/common/store/pages/remixes/selectors'
import { pluralize } from 'audius-client/src/common/utils/formatUtil'
import { Pressable, Text, View } from 'react-native'

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
    ...typography.body
  },
  link: {
    color: palette.secondary
  },
  user: {
    ...flexRowCentered()
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

  return (
    <Screen>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={
          track && user ? (
            <View style={styles.header}>
              <Text style={styles.text}>
                {`${count || ''} ${pluralize(
                  messages.remix,
                  count,
                  'es',
                  !count
                )} ${messages.of}`}
              </Text>
              <View style={styles.track}>
                <Pressable onPress={handlePressTrack}>
                  <Text style={[styles.text, styles.link]}>{track.title}</Text>
                </Pressable>
                <Text style={styles.text}>{messages.of}&nbsp;</Text>
                <Pressable style={styles.user} onPress={handlePressArtistName}>
                  <Text style={[styles.text, styles.link]}>{user.name}</Text>
                  {user ? (
                    <UserBadges user={user} badgeSize={10} hideName />
                  ) : null}
                </Pressable>
              </View>
            </View>
          ) : null
        }
        actions={tracksActions}
      />
    </Screen>
  )
}
