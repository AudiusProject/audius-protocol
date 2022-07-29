import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/track/lineup/actions'
import {
  getLineup,
  getRemixParentTrack,
  getTrack,
  getUser
} from 'audius-client/src/common/store/pages/track/selectors'
import { trackRemixesPage } from 'audius-client/src/utils/route'
import { omit } from 'lodash'
import { Text, View } from 'react-native'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, Screen } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { TrackScreenMainContent } from './TrackScreenMainContent'

const getMoreByArtistLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  lineupHeader: {
    width: '100%',
    textAlign: 'center',
    ...typography.h3,
    color: palette.neutralLight3,
    textTransform: 'uppercase'
  },
  buttonContainer: {
    padding: spacing(6)
  },
  button: {
    backgroundColor: palette.secondary
  }
}))

/**
 * `TrackScreen` displays a single track and a Lineup of more tracks by the artist
 */
export const TrackScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { params } = useRoute<'Track'>()

  // params is incorrectly typed and can sometimes be undefined
  const { searchTrack } = params ?? {}

  const cachedTrack = useSelectorWeb(
    (state) => getTrack(state, params),
    // Omitting uneeded fields from the equality check because they are
    // causing extra renders when added to the `track` object
    (a, b) => {
      const omitUneeded = <T extends object | null>(o: T) =>
        omit(o, ['_stems', '_remix_parents'])
      return isEqual(omitUneeded(a), omitUneeded(b))
    }
  )

  const track = cachedTrack ?? searchTrack

  const cachedUser = useSelectorWeb(
    (state) => getUser(state, { id: track?.owner_id }),
    isEqual
  )

  const user = cachedUser ?? searchTrack?.user

  const lineup = useSelectorWeb(
    getMoreByArtistLineup,
    // Checking for equality between the entries themselves, because
    // lineup reset state changes cause extra renders
    (a, b) => (!a.entries && !b.entries) || isEqual(a.entries, b.entries)
  )
  const remixParentTrack = useSelectorWeb(getRemixParentTrack)

  if (!track || !user) {
    console.warn(
      'Track, user, or lineup missing for TrackScreen, preventing render'
    )
    return null
  }

  const handlePressGoToRemixes = () => {
    if (!remixParentTrack) {
      return
    }
    navigation.push({
      native: {
        screen: 'TrackRemixes',
        params: { id: remixParentTrack.track_id }
      },
      web: { route: trackRemixesPage(remixParentTrack.permalink) }
    })
  }

  const remixParentTrackId = track.remix_of?.tracks?.[0]?.parent_track_id
  const showMoreByArtistTitle =
    (remixParentTrackId && lineup.entries.length > 2) ||
    (!remixParentTrackId && lineup.entries.length > 1)

  const hasValidRemixParent =
    !!remixParentTrackId &&
    !!remixParentTrack &&
    remixParentTrack.is_delete === false &&
    !remixParentTrack.user?.is_deactivated

  const moreByArtistTitle = showMoreByArtistTitle ? (
    <Text
      style={styles.lineupHeader}
    >{`${messages.moreBy} ${user?.name}`}</Text>
  ) : null

  const originalTrackTitle = (
    <Text style={styles.lineupHeader}>{messages.originalTrack}</Text>
  )

  return (
    <Screen>
      <Lineup
        actions={tracksActions}
        count={6}
        header={
          <TrackScreenMainContent
            lineup={lineup}
            remixParentTrack={remixParentTrack}
            track={track}
            user={user}
            lineupHeader={
              hasValidRemixParent ? originalTrackTitle : moreByArtistTitle
            }
          />
        }
        leadingElementId={remixParentTrack?.track_id}
        leadingElementDelineator={
          <>
            <View style={styles.buttonContainer}>
              <Button
                title={messages.viewOtherRemixes}
                icon={IconArrow}
                variant='primary'
                size='small'
                onPress={handlePressGoToRemixes}
                fullWidth
                styles={{
                  root: styles.button
                }}
              />
            </View>
            {moreByArtistTitle}
          </>
        }
        lineup={lineup}
        start={1}
        includeLineupStatus
      />
    </Screen>
  )
}
