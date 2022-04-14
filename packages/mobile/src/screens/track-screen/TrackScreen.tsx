import { ReactNode } from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { LineupState } from 'audius-client/src/common/models/Lineup'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/track/lineup/actions'
import {
  getLineup,
  getRemixParentTrack,
  getTrack,
  getUser
} from 'audius-client/src/common/store/pages/track/selectors'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { trackRemixesPage } from 'audius-client/src/utils/route'
import { isEqual, omit } from 'lodash'
import { Text, View } from 'react-native'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, Screen } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'
import { TrackScreenRemixes } from './TrackScreenRemixes'

const getMoreByArtistLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    padding: spacing(3),
    paddingBottom: 0
  },
  headerContainer: {
    marginBottom: spacing(6)
  },
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

type TrackScreenMainContentProps = {
  lineup: LineupState<{ id: ID }>
  lineupHeader: ReactNode
  remixParentTrack: Nullable<Track & { user: User }>
  track: Track
  user: User
}

/**
 * `TrackScreenMainContent` includes everything above the Lineup
 */
const TrackScreenMainContent = ({
  lineup,
  lineupHeader,
  track,
  user
}: TrackScreenMainContentProps) => {
  const navigation = useNavigation()
  const styles = useStyles()

  const remixTrackIds = track._remixes?.map(({ track_id }) => track_id) ?? null

  const handlePressGoToRemixes = () => {
    navigation.push({
      native: { screen: 'TrackRemixes', params: { id: track.track_id } },
      web: { route: trackRemixesPage(track.permalink) }
    })
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerContainer}>
        <TrackScreenDetailsTile
          track={track}
          user={user}
          uid={lineup?.entries?.[0]?.uid}
          isLineupLoading={!lineup?.entries?.[0]}
        />
      </View>

      {track.field_visibility?.remixes &&
        remixTrackIds &&
        remixTrackIds.length > 0 && (
          <TrackScreenRemixes
            trackIds={remixTrackIds}
            onPressGoToRemixes={handlePressGoToRemixes}
            count={track._remixes_count ?? null}
          />
        )}
      {lineupHeader}
    </View>
  )
}

/**
 * `TrackScreen` displays a single track and a Lineup of more tracks by the artist
 */
export const TrackScreen = () => {
  const navigation = useNavigation()
  const { params } = useRoute<'Track'>()

  const styles = useStyles()

  const track = useSelectorWeb(
    state => getTrack(state, params),
    // Omitting uneeded fields from the equality check because they are
    // causing extra renders when added to the `track` object
    (a, b) => {
      const omitUneeded = o => omit(o, ['_stems', '_remix_parents'])
      return isEqual(omitUneeded(a), omitUneeded(b))
    }
  )

  const user = useSelectorWeb(
    state => getUser(state, { id: track?.owner_id }),
    isEqual
  )

  const lineup = useSelectorWeb(
    getMoreByArtistLineup,
    // Checking for equality between the entries themselves, because
    // lineup reset state changes cause extra renders
    (a, b) => (!a.entries && !b.entries) || isEqual(a.entries, b.entries)
  )
  const remixParentTrack = useSelectorWeb(getRemixParentTrack)

  if (!track || !user || !lineup) {
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
