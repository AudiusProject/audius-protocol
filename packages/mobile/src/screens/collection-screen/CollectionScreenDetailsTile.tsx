import { useCallback, useMemo } from 'react'

import { Name, PlaybackSource } from 'audius-client/src/common/models/Analytics'
import { ID, UID } from 'audius-client/src/common/models/Identifiers'
import Status from 'audius-client/src/common/models/Status'
import { makeGetTableMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/collection/lineup/actions'
import { getCollectionTracksLineup } from 'audius-client/src/common/store/pages/collection/selectors'
import { formatSecondsAsText } from 'audius-client/src/common/utils/timeUtil'
import { Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import { DetailsTile } from 'app/components/details-tile'
import {
  DetailsTileDetail,
  DetailsTileProps
} from 'app/components/details-tile/types'
import { TrackList } from 'app/components/track-list'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid, getTrack } from 'app/store/audio/selectors'
import { makeStyles } from 'app/styles'
import { make, track } from 'app/utils/analytics'
import { formatCount } from 'app/utils/format'

const messages = {
  album: 'Album',
  playlist: 'Playlist',
  empty: 'This playlist is empty.',
  privatePlaylist: 'Private Playlist',
  publishing: 'Publishing...',
  detailsPlaceholder: '---'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  trackListDivider: {
    marginHorizontal: spacing(6),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight7
  },
  empty: {
    ...typography.body,
    color: palette.neutral,
    marginBottom: spacing(8),
    alignSelf: 'center'
  }
}))

type CollectionScreenDetailsTileProps = {
  isAlbum?: boolean
  isPrivate?: boolean
  extraDetails?: DetailsTileDetail[]
} & Omit<
  DetailsTileProps,
  'descriptionLinkPressSource' | 'details' | 'headerText' | 'onPressPlay'
>

const getTracksLineup = makeGetTableMetadatas(getCollectionTracksLineup)

const recordPlay = (id, play = true) => {
  track(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.PLAYLIST_PAGE
    })
  )
}

export const CollectionScreenDetailsTile = ({
  description,
  extraDetails = [],
  isAlbum,
  isPrivate,
  ...detailsTileProps
}: CollectionScreenDetailsTileProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const tracksLineup = useSelectorWeb(getTracksLineup)
  const tracksLoading = tracksLineup.status === Status.LOADING
  const numTracks = tracksLineup.entries.length

  const duration = tracksLineup.entries?.reduce(
    (duration, entry) => duration + entry.duration,
    0
  )

  const details = useMemo(() => {
    if (!tracksLoading && numTracks === 0) return []
    return [
      {
        label: 'Tracks',
        value: tracksLoading
          ? messages.detailsPlaceholder
          : formatCount(numTracks)
      },
      {
        label: 'Duration',
        value: tracksLoading
          ? messages.detailsPlaceholder
          : formatSecondsAsText(duration)
      },
      ...extraDetails
    ].filter(({ isHidden, value }) => !isHidden && !!value)
  }, [tracksLoading, numTracks, duration, extraDetails])

  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const playingTrack = useSelector(getTrack)
  const trackId = playingTrack?.trackId

  const isQueued = tracksLineup.entries.some(
    (entry) => playingUid === entry.uid
  )

  const handlePressPlay = useCallback(() => {
    if (isPlaying && isQueued) {
      dispatchWeb(tracksActions.pause())
      recordPlay(trackId, false)
    } else if (!isPlaying && isQueued) {
      dispatchWeb(tracksActions.play())
      recordPlay(trackId)
    } else if (tracksLineup.entries.length > 0) {
      dispatchWeb(tracksActions.play(tracksLineup.entries[0].uid))
      recordPlay(tracksLineup.entries[0].track_id)
    }
  }, [dispatchWeb, isPlaying, trackId, tracksLineup, isQueued])

  const handlePressTrackListItemPlay = useCallback(
    (uid: UID, id: ID) => {
      if (isPlaying && playingUid === uid) {
        dispatchWeb(tracksActions.pause())
        recordPlay(id, false)
      } else if (playingUid !== uid) {
        dispatchWeb(tracksActions.play(uid))
        recordPlay(id)
      } else {
        dispatchWeb(tracksActions.play())
        recordPlay(id)
      }
    },
    [dispatchWeb, isPlaying, playingUid]
  )

  const headerText = useMemo(() => {
    if (isAlbum) {
      return messages.album
    }

    if (isPrivate) {
      return messages.privatePlaylist
    }

    return messages.playlist
  }, [isAlbum, isPrivate])

  const renderTrackList = () => {
    if (tracksLoading)
      return (
        <>
          <View style={styles.trackListDivider} />
          <TrackList hideArt showDivider showSkeleton tracks={Array(20)} />
        </>
      )

    return tracksLineup.entries.length === 0 ? (
      <Text style={styles.empty}>{messages.empty}</Text>
    ) : (
      <>
        <View style={styles.trackListDivider} />
        <TrackList
          hideArt
          showDivider
          togglePlay={handlePressTrackListItemPlay}
          tracks={tracksLineup.entries}
        />
      </>
    )
  }

  return (
    <DetailsTile
      {...detailsTileProps}
      description={description}
      descriptionLinkPressSource='collection page'
      details={details}
      headerText={headerText}
      hideListenCount={true}
      isPlaying={isPlaying && isQueued}
      renderBottomContent={renderTrackList}
      onPressPlay={handlePressPlay}
    />
  )
}
