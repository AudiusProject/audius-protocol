import type { ReactElement } from 'react'

import type { ID, UID } from '@audius/common'
import type { FlatListProps } from 'react-native'
import { FlatList, View } from 'react-native'
import type { DraggableFlatListProps } from 'react-native-draggable-flatlist'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { useSelector } from 'react-redux'

import * as haptics from 'app/haptics'
import { getPlaying, getPlayingUid } from 'app/store/audio/selectors'
import { makeStyles } from 'app/styles'

import type { TrackItemAction } from './TrackListItem'
import { TrackListItem } from './TrackListItem'
import { TrackListItemSkeleton } from './TrackListItemSkeleton'
import type { TrackMetadata, TracksMetadata } from './types'

type TrackListProps = {
  hideArt?: boolean
  isReorderable?: boolean
  noDividerMargin?: boolean
  onRemove?: (index: number) => void
  onReorder?: DraggableFlatListProps<TrackMetadata>['onDragEnd']
  onSave?: (isSaved: boolean, trackId: ID) => void
  playingUid?: UID
  showDivider?: boolean
  showSkeleton?: boolean
  showTopDivider?: boolean
  togglePlay?: (uid: string, trackId: ID) => void
  trackItemAction?: TrackItemAction
  tracks: TracksMetadata
} & Partial<FlatListProps<TrackMetadata>>

const useStyles = makeStyles(({ palette, spacing }) => ({
  divider: {
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1,
    marginVertical: 0,
    marginHorizontal: spacing(6)
  },
  noMarginDivider: {
    borderBottomColor: palette.neutralLight8,
    marginHorizontal: 0
  },
  hideDivider: {
    opacity: 0
  }
}))

/**
 * A FlatList of tracks
 *
 * If isReorderable === true, make sure the TrackList is not nested in a ScrollView,
 * otherwise certain features like auto scroll while dragging will not work
 */
export const TrackList = ({
  hideArt,
  isReorderable,
  noDividerMargin,
  onRemove,
  onReorder,
  onSave,
  showDivider,
  showSkeleton,
  showTopDivider,
  togglePlay,
  trackItemAction,
  tracks,
  ...otherProps
}: TrackListProps) => {
  const styles = useStyles()

  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)

  const renderSkeletonTrack = ({ index }) => (
    <View>
      {showDivider && (showTopDivider || index > 0) ? (
        <View
          style={[styles.divider, noDividerMargin && styles.noMarginDivider]}
        />
      ) : null}
      <TrackListItemSkeleton />
    </View>
  )

  const renderDraggableTrack: DraggableFlatListProps<TrackMetadata>['renderItem'] =
    ({ item: track, index = -1, drag, isActive: isDragActive }) => {
      const isActive = track.uid !== undefined && track.uid === playingUid

      // The dividers above and belove the active track should be hidden
      const hideDivider = isActive || tracks[index - 1]?.uid === playingUid

      return (
        <View>
          {showDivider && (showTopDivider || index > 0) ? (
            <View
              style={[
                styles.divider,
                hideDivider && styles.hideDivider,
                noDividerMargin && styles.noMarginDivider
              ]}
            />
          ) : null}
          <TrackListItem
            index={index}
            drag={drag}
            hideArt={hideArt}
            isActive={isActive}
            isDragging={isDragActive}
            isPlaying={isPlaying}
            isReorderable={isReorderable}
            track={track}
            key={track.track_id}
            onSave={onSave}
            togglePlay={togglePlay}
            trackItemAction={trackItemAction}
            onRemove={onRemove}
          />
        </View>
      )
    }

  const renderTrack: FlatListProps<TrackMetadata>['renderItem'] = ({
    item,
    index
  }) =>
    renderDraggableTrack({
      item,
      index,
      drag: () => {},
      isActive: false
    }) as ReactElement

  if (showSkeleton)
    return (
      <FlatList
        {...otherProps}
        data={tracks}
        renderItem={renderSkeletonTrack}
      />
    )

  return isReorderable ? (
    <DraggableFlatList
      {...otherProps}
      autoscrollThreshold={200}
      data={tracks}
      keyExtractor={(track, index) => `${track.track_id} ${index}`}
      onDragBegin={() => {
        haptics.light()
      }}
      onPlaceholderIndexChange={() => {
        haptics.light()
      }}
      onDragEnd={(p) => {
        onReorder?.(p)
      }}
      renderItem={renderDraggableTrack}
      renderPlaceholder={() => <View />}
    />
  ) : (
    <FlatList {...otherProps} data={tracks} renderItem={renderTrack} />
  )
}
