import { useCallback } from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/track/lineup/actions'
import {
  getLineup,
  getTrack,
  getUser
} from 'audius-client/src/common/store/pages/track/selectors'
import { isEqual } from 'lodash'
import { StyleSheet, View } from 'react-native'

import { BaseStackParamList } from 'app/components/app-navigator/types'
import { Lineup } from 'app/components/lineup'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import { TrackScreenHeader } from './TrackScreenHeader'

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
      padding: 12,
      paddingBottom: 0
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

/**
 * `TrackScreen` displays a single track and a Lineup of more tracks by the artist
 */
export const TrackScreen = ({ route, navigation }: Props) => {
  const styles = useThemedStyles(createStyles)

  const dispatchWeb = useDispatchWeb()
  const track = useSelectorWeb(getTrack)
  const user = useSelectorWeb(getUser)
  const currentUserId = useSelectorWeb(getUserId)
  const moreByArtistLineup = useSelectorWeb(getMoreByArtistLineup, isEqual)

  const remixParentTrackId = track?.remix_of?.tracks?.[0]?.parent_track_id
  const showMoreByArtistTitle =
    (remixParentTrackId && moreByArtistLineup.entries.length > 2) ||
    (!remixParentTrackId && moreByArtistLineup.entries.length > 1)

  const playTrack = useCallback(
    (uid?: string) => {
      dispatchWeb(tracksActions.play(uid))
    },
    [dispatchWeb]
  )

  const pauseTrack = useCallback(() => {
    dispatchWeb(tracksActions.pause())
  }, [dispatchWeb])

  const moreByArtistTitle = showMoreByArtistTitle && (
    <Text
      style={styles.lineupHeader}
      weight='bold'
    >{`${messages.moreBy} ${user?.name}`}</Text>
  )

  return (
    <View>
      <Lineup
        actions={tracksActions}
        header={
          track &&
          user && (
            <View style={styles.headerContainer}>
              <TrackScreenHeader
                track={track}
                user={user}
                uid={moreByArtistLineup?.entries?.[0]?.uid}
                currentUserId={currentUserId}
              />
              {moreByArtistTitle}
            </View>
          )
        }
        lineup={moreByArtistLineup}
        pauseTrack={pauseTrack}
        playTrack={playTrack}
      />
    </View>
  )
}
