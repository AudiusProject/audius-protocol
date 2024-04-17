import type { UID, LineupTrack } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { playerSelectors } from '@audius/common/store'
import { range } from 'lodash'
import { Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import Skeleton from 'app/components/skeleton'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
const { getUid } = playerSelectors

// Max number of tracks to display
const DISPLAY_TRACK_COUNT = 5

type LineupTileTrackListProps = {
  isLoading?: boolean
  onPress: GestureResponderHandler
  trackCount?: number
  tracks: LineupTrack[]
  isAlbum: boolean
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
  showSkeleton?: boolean
  index: number
  track?: LineupTrack
  uid?: UID
  isAlbum?: boolean
}

const TrackItem = (props: TrackItemProps) => {
  const { showSkeleton, index, track, uid, isAlbum } = props
  const styles = useStyles()
  const isPlayingUid = useSelector(
    (state: CommonState) => getUid(state) === uid
  )
  return (
    <>
      <View style={styles.divider} />
      <View style={styles.item}>
        {showSkeleton ? (
          <Skeleton width='100%' height={10} />
        ) : !track ? null : (
          <>
            <Text style={[styles.text, isPlayingUid && styles.active]}>
              {index + 1}
            </Text>
            <Text
              style={[styles.text, styles.title, isPlayingUid && styles.active]}
              numberOfLines={1}
            >
              {track.title}
            </Text>
            {!isAlbum ? (
              <Text
                style={[
                  styles.text,
                  styles.artist,
                  isPlayingUid && styles.active
                ]}
                numberOfLines={1}
              >
                {`by ${track.user.name}`}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </>
  )
}

export const CollectionTileTrackList = (props: LineupTileTrackListProps) => {
  const { isLoading, onPress, trackCount, tracks, isAlbum } = props
  const styles = useStyles()

  if (!tracks.length && isLoading) {
    return (
      <>
        {range(DISPLAY_TRACK_COUNT).map((i) => (
          <TrackItem key={i} index={i} showSkeleton isAlbum={isAlbum} />
        ))}
      </>
    )
  }

  return (
    <Pressable onPress={onPress}>
      {tracks.slice(0, DISPLAY_TRACK_COUNT).map((track, index) => (
        <TrackItem
          key={track.uid}
          uid={track.uid}
          index={index}
          track={track}
          isAlbum={isAlbum}
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
