import { ID } from 'audius-client/src/common/models/Identifiers'
import { FlatList, View } from 'react-native'

import { makeStyles } from 'app/styles'

import { TrackItemAction, TrackListItem } from './TrackListItem'
import { ListTrackMetadata } from './types'

type TrackListProps = {
  tracks: Array<ListTrackMetadata>
  showTopDivider?: boolean
  showDivider?: boolean
  noDividerMargin?: boolean
  onSave?: (isSaved: boolean, trackId: ID) => void
  onRemove?: (index: number) => void
  togglePlay?: (uid: string, trackId: ID) => void
  trackItemAction?: TrackItemAction
  isReorderable?: boolean
  onReorder?: (index1: number, index2: number) => void
}

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

export const TrackList = ({
  noDividerMargin,
  onSave,
  showDivider,
  showTopDivider,
  togglePlay,
  trackItemAction,
  tracks
}: TrackListProps) => {
  const styles = useStyles()
  const activeIndex = tracks.findIndex(track => track.isActive)

  const renderTrack = ({
    item: track,
    index
  }: {
    item: ListTrackMetadata
    index: number
  }) => {
    // The dividers above and belove the active track should be hidden
    const hideDivider =
      activeIndex >= 0 && (activeIndex === index || activeIndex === index - 1)

    return (
      <View key={track.uid}>
        {showDivider && (showTopDivider || index > 0) ? (
          <View
            style={[
              styles.divider,
              hideDivider && styles.hideDivider,
              noDividerMargin ? styles.noMarginDivider : {}
            ]}
          />
        ) : null}
        <TrackListItem
          {...track}
          key={track.trackId}
          index={index}
          onSave={onSave}
          togglePlay={togglePlay}
          trackItemAction={trackItemAction}
        />
      </View>
    )
  }

  return <FlatList data={tracks} renderItem={renderTrack} />
}
