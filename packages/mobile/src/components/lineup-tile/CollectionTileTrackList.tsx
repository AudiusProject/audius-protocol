import { LineupTrack } from 'audius-client/src/common/models/Track'
import { range } from 'lodash'
import { Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import Skeleton from 'app/components/skeleton'
import { getPlayingUid } from 'app/store/audio/selectors'
import { flexRowCentered, makeStyles } from 'app/styles'
import { GestureResponderHandler } from 'app/types/gesture'

// Max number of tracks to display
const DISPLAY_TRACK_COUNT = 5

type LineupTileTrackListProps = {
  isLoading?: boolean
  onPress: GestureResponderHandler
  trackCount?: number
  tracks: LineupTrack[]
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  item: {
    ...flexRowCentered(),
    justifyContent: 'flex-start',
    ...typography.body,
    width: '100%',
    height: spacing(7),
    paddingHorizontal: spacing(2)
  },

  text: {
    ...typography.body2,
    color: palette.neutralLight4,
    lineHeight: spacing(7),
    paddingHorizontal: spacing(1)
  },

  title: {
    color: palette.neutral,
    flexShrink: 1
  },

  artist: {
    flexShrink: 1
  },

  active: {
    color: palette.primary
  },

  divider: {
    marginHorizontal: spacing(3),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight8
  },

  more: {
    color: palette.neutralLight4
  }
}))

type TrackItemProps = {
  active: boolean
  showSkeleton?: boolean
  index: number
  track?: LineupTrack
}

const TrackItem = ({ track, active, index, showSkeleton }: TrackItemProps) => {
  const styles = useStyles()
  return (
    <>
      <View style={styles.divider} />
      <View style={styles.item}>
        {showSkeleton ? (
          <Skeleton width='100%' height='10' />
        ) : !track ? null : (
          <>
            <Text style={[styles.text, active && styles.active]}>
              {index + 1}
            </Text>
            <Text
              style={[styles.text, styles.title, active && styles.active]}
              numberOfLines={1}>
              {track.title}
            </Text>
            <Text
              style={[styles.text, styles.artist, active && styles.active]}
              numberOfLines={1}>
              {`by ${track.user.name}`}
            </Text>
          </>
        )}
      </View>
    </>
  )
}

export const CollectionTileTrackList = ({
  isLoading,
  onPress,
  trackCount,
  tracks
}: LineupTileTrackListProps) => {
  const styles = useStyles()
  const playingUid = useSelector(getPlayingUid)

  if (!tracks.length && isLoading) {
    return (
      <>
        {range(DISPLAY_TRACK_COUNT).map((i) => (
          <TrackItem key={i} active={false} index={i} showSkeleton />
        ))}
      </>
    )
  }

  return (
    <Pressable onPress={onPress}>
      {tracks.slice(0, DISPLAY_TRACK_COUNT).map((track, index) => (
        <TrackItem
          key={track.uid}
          active={playingUid === track.uid}
          index={index}
          track={track}
        />
      ))}
      {trackCount && trackCount > 5 ? (
        <>
          <View style={styles.divider} />
          <Text style={[styles.item, styles.more]}>
            {`+${trackCount - tracks.length} more tracks`}
          </Text>
        </>
      ) : null}
    </Pressable>
  )
}
