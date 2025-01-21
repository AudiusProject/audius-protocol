import type { ReactElement } from 'react'
import { Fragment, useCallback, useMemo, useState } from 'react'

import type { ID, UID } from '@audius/common/models'
import type { FlatListProps } from 'react-native'
import { FlatList, View } from 'react-native'
import type {
  DragEndParams,
  DraggableFlatListProps
} from 'react-native-draggable-flatlist'
import DraggableFlatList, {
  OpacityDecorator
} from 'react-native-draggable-flatlist'

import * as haptics from 'app/haptics'

import type { TrackItemAction } from './TrackListItem'
import { TrackListItem } from './TrackListItem'
import { TrackListItemSkeleton } from './TrackListItemSkeleton'

type TrackListProps = {
  hideArt?: boolean
  // Accept ids as well as uids because some use cases don't have uids available
  // For example the EditPlaylist track list
  ids?: ID[]
  contextPlaylistId?: ID
  isReorderable?: boolean
  isAlbumPage?: boolean
  onRemove?: (index: number) => void
  onReorder?: DraggableFlatListProps<UID | ID>['onDragEnd']
  showSkeleton?: boolean
  togglePlay?: (uid: string, trackId: ID) => void
  trackItemAction?: TrackItemAction
  uids?: UID[]
} & Partial<FlatListProps<UID | ID>>

const noOp = () => {}
const keyExtractor = (item: string | number) => String(item)

/**
 * A FlatList of tracks
 *
 * If isReorderable === true, make sure the TrackList is not nested in a ScrollView,
 * otherwise certain features like auto scroll while dragging will not work
 */
export const TrackList = ({
  contextPlaylistId,
  hideArt,
  ids,
  isReorderable,
  isAlbumPage = false,
  onRemove,
  onReorder,
  showSkeleton,
  togglePlay,
  trackItemAction,
  uids,
  ...otherProps
}: TrackListProps) => {
  const data = useMemo(() => uids ?? ids ?? [], [uids, ids])
  const [scrollEnable, setScrollEnable] = useState(true)

  const renderSkeletonTrack = useCallback(() => <TrackListItemSkeleton />, [])

  const renderDraggableTrack: DraggableFlatListProps<UID | ID>['renderItem'] =
    useCallback(
      ({ item, getIndex = () => -1, drag }) => {
        const index = getIndex() ?? -1
        const RootView = isReorderable ? OpacityDecorator : Fragment
        return (
          <RootView>
            <TrackListItem
              id={ids && (item as ID)}
              contextPlaylistId={contextPlaylistId}
              index={index}
              onDrag={drag}
              hideArt={hideArt}
              isReorderable={isReorderable}
              showViewAlbum={isAlbumPage}
              uid={uids && (item as UID)}
              key={item}
              togglePlay={togglePlay}
              trackItemAction={trackItemAction}
              onRemove={onRemove}
            />
          </RootView>
        )
      },
      [
        contextPlaylistId,
        hideArt,
        ids,
        isAlbumPage,
        isReorderable,
        onRemove,
        togglePlay,
        trackItemAction,
        uids
      ]
    )

  const renderTrack: FlatListProps<UID | ID>['renderItem'] = useCallback(
    ({ item, index }) =>
      renderDraggableTrack({
        item,
        getIndex: () => index,
        drag: noOp,
        isActive: false
      }) as ReactElement,
    [renderDraggableTrack]
  )

  const handleDragBegin = useCallback(() => {
    haptics.medium()
    setScrollEnable(false)
  }, [])

  const handleDragEnd = useCallback(
    (params: DragEndParams<string | number>) => {
      onReorder?.(params)
      setScrollEnable(true)
    },
    [onReorder]
  )

  if (showSkeleton)
    return (
      <FlatList
        {...otherProps}
        data={new Array(8)}
        renderItem={renderSkeletonTrack}
      />
    )

  return isReorderable ? (
    <DraggableFlatList
      {...otherProps}
      autoscrollThreshold={200}
      activationDistance={scrollEnable ? 100 : 1}
      data={data}
      keyExtractor={keyExtractor}
      onDragBegin={handleDragBegin}
      onPlaceholderIndexChange={haptics.light}
      onDragEnd={handleDragEnd}
      renderItem={renderDraggableTrack}
      renderPlaceholder={() => <View />}
    />
  ) : (
    <FlatList
      {...otherProps}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderTrack}
    />
  )
}
