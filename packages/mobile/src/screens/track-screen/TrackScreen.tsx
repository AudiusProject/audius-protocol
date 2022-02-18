import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { LineupState } from 'audius-client/src/common/models/Lineup'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/track/lineup/actions'
import {
  getLineup,
  getTrack,
  getUser
} from 'audius-client/src/common/store/pages/track/selectors'
import { trackRemixesPage } from 'audius-client/src/utils/route'
import { isEqual } from 'lodash'
import { StyleSheet, View } from 'react-native'

import { BaseStackParamList } from 'app/components/app-navigator/types'
import { Lineup } from 'app/components/lineup'
import Text from 'app/components/text'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import { TrackScreenHeader } from './TrackScreenHeader'
import { TrackScreenRemixes } from './TrackScreenRemixes'

// We might need to allow BaseStackParamList to be generic here
// to get all the relevant params
type Props = NativeStackScreenProps<BaseStackParamList, 'track'>

const getMoreByArtistLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      padding: 12
    },
    headerContainer: {
      marginBottom: 24
    },
    lineupHeader: {
      width: '100%',
      textAlign: 'center',
      color: themeColors.neutralLight3,
      fontSize: 14,
      marginTop: 36,
      textTransform: 'uppercase'
    }
  })

type TrackScreenMainContentProps = {
  lineup: LineupState<Track>
  track: Track
  user: User
}

/**
 * `TrackScreenMainContent` includes everything above the Lineup
 */
const TrackScreenMainContent = ({
  lineup,
  track,
  user
}: TrackScreenMainContentProps) => {
  const styles = useThemedStyles(createStyles)
  const pushRouteWeb = usePushRouteWeb()

  const currentUserId = useSelectorWeb(getUserId)

  const remixParentTrackId = track.remix_of?.tracks?.[0]?.parent_track_id
  const remixTrackIds = track._remixes?.map(({ track_id }) => track_id) ?? null
  const showMoreByArtistTitle =
    (remixParentTrackId && lineup.entries.length > 2) ||
    (!remixParentTrackId && lineup.entries.length > 1)

  const moreByArtistTitle = showMoreByArtistTitle && (
    <Text
      style={styles.lineupHeader}
      weight='bold'
    >{`${messages.moreBy} ${user?.name}`}</Text>
  )

  const goToAllRemixes = () => {
    // TODO: sk - implement this page in RN
    pushRouteWeb(trackRemixesPage(track.permalink))
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerContainer}>
        <TrackScreenHeader
          track={track}
          user={user}
          uid={lineup?.entries?.[0]?.uid}
          currentUserId={currentUserId}
        />
      </View>

      {track.field_visibility?.remixes &&
        remixTrackIds &&
        remixTrackIds.length > 0 && (
          <TrackScreenRemixes
            trackIds={remixTrackIds}
            goToAllRemixes={goToAllRemixes}
            count={track._remixes_count ?? null}
          />
        )}
      {moreByArtistTitle}
    </View>
  )
}

/**
 * `TrackScreen` displays a single track and a Lineup of more tracks by the artist
 */
export const TrackScreen = ({ route, navigation }: Props) => {
  const lineup = useSelectorWeb(getMoreByArtistLineup, isEqual)
  const track = useSelectorWeb(getTrack)
  const user = useSelectorWeb(getUser)

  return (
    <View>
      <Lineup
        actions={tracksActions}
        header={
          track && user ? (
            <TrackScreenMainContent track={track} user={user} lineup={lineup} />
          ) : null
        }
        lineup={lineup}
      />
    </View>
  )
}
