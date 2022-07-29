import { memo, useCallback } from 'react'

import { ID, CoverArtSizes } from '@audius/common'
import cn from 'classnames'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import { HapticFeedbackMessage } from 'services/native-mobile-interface/haptics'

import TrackListItem from './ConnectedTrackListItem'
import styles from './TrackList.module.css'
import { TrackItemAction } from './TrackListItem'

type TrackListProps = {
  containerClassName?: string
  itemClassName?: string
  tracks: Array<{
    isLoading: boolean
    isSaved?: boolean
    isReposted?: boolean
    isActive?: boolean
    isPlaying?: boolean
    isRemoveActive?: boolean
    artistHandle: string
    artistName: string
    trackTitle: string
    trackId: ID
    uid?: string
    time?: number
    coverArtSizes?: CoverArtSizes
    isDeleted: boolean
  }>
  showTopDivider?: boolean
  showDivider?: boolean
  noDividerMargin?: boolean
  showBorder?: boolean
  onSave?: (isSaved: boolean, trackId: ID) => void
  onRemove?: (index: number) => void
  togglePlay?: (uid: string, trackId: ID) => void
  trackItemAction?: TrackItemAction
  isReorderable?: boolean
  onReorder?: (index1: number, index2: number) => void
}

const TrackList = ({
  containerClassName = '',
  itemClassName,
  tracks,
  onSave,
  onRemove,
  showTopDivider,
  showDivider,
  noDividerMargin,
  showBorder,
  togglePlay,
  trackItemAction,
  isReorderable = false,
  onReorder = () => {}
}: TrackListProps) => {
  const onDragEnd = useCallback(
    (result: any) => {
      const { source, destination } = result

      if (!source || !destination) return
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return
      onReorder(source.index, destination.index)
    },
    [onReorder]
  )
  const onDragStart = () => {
    const message = new HapticFeedbackMessage()
    message.send()
  }
  const onDragUpdate = () => {
    const message = new HapticFeedbackMessage()
    message.send()
  }

  // The dividers above and belove the active track should be hidden
  const activeIndex = tracks.findIndex((track) => track.isActive)
  const hideDivider = (idx: number) =>
    activeIndex >= 0 && (activeIndex === idx || activeIndex === idx - 1)

  const renderedTracks = tracks.map((track, idx) => {
    const listItem = (isDragging?: boolean) => (
      <div key={track.uid}>
        {showDivider && (showTopDivider || idx > 0) ? (
          <div
            className={cn(styles.divider, {
              [styles.hideDivider]: hideDivider(idx),
              [styles.noMargin]: noDividerMargin
            })}
          ></div>
        ) : null}
        <TrackListItem
          index={idx}
          trackId={track.trackId}
          className={itemClassName}
          isLoading={track.isLoading}
          isSaved={track.isSaved}
          isReposted={track.isReposted}
          isActive={track.isActive}
          isPlaying={track.isPlaying}
          artistHandle={track.artistHandle}
          artistName={track.artistName}
          trackTitle={track.trackTitle}
          coverArtSizes={track.coverArtSizes}
          uid={track.uid}
          isDeleted={track.isDeleted}
          onSave={onSave}
          isRemoveActive={track.isRemoveActive}
          onRemove={onRemove}
          togglePlay={togglePlay}
          trackItemAction={trackItemAction}
          isReorderable={isReorderable}
          isDragging={isDragging}
        />
      </div>
    )
    const key = track?.time
      ? `${track.trackId}:${track.time}`
      : track.trackId.toString()
    return isReorderable ? (
      <Draggable key={key} draggableId={key} index={idx}>
        {(provided: any, snapshot: any) => {
          const updatedStyles = provided.draggableProps.style.transform
            ? {
                transform: `translate3d(0, ${provided.draggableProps.style.transform.substring(
                  provided.draggableProps.style.transform.indexOf(',') + 1,
                  provided.draggableProps.style.transform.indexOf(')')
                )}, 0)`
              }
            : {}
          return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                ...provided.dragHandleProps.style,
                ...updatedStyles
              }}
            >
              {listItem(snapshot.isDragging)}
            </div>
          )
        }}
      </Draggable>
    ) : (
      listItem()
    )
  })

  return (
    <div
      className={cn(styles.trackListContainer, containerClassName, {
        [styles.border]: showBorder
      })}
    >
      {isReorderable ? (
        <DragDropContext
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
        >
          <Droppable droppableId='track-list-droppable' type='TRACK'>
            {(provided: any, snapshot: any) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {renderedTracks}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        renderedTracks
      )}
    </div>
  )
}

TrackList.defaultProps = {
  hasTopDivider: false,
  showDivider: true,
  showBorder: false
}

export default memo(TrackList)
