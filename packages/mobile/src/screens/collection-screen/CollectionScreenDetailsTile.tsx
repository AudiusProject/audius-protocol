import { useCallback, useEffect, useMemo } from 'react'

import type { ID, UID } from '@audius/common'
import {
  playerSelectors,
  Status,
  Name,
  PlaybackSource,
  formatSecondsAsText,
  lineupSelectors,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors
} from '@audius/common'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { DetailsTile } from 'app/components/details-tile'
import type {
  DetailsTileDetail,
  DetailsTileProps
} from 'app/components/details-tile/types'
import { TrackList } from 'app/components/track-list'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { formatCount } from 'app/utils/format'
const { getCollectionTracksLineup } = collectionPageSelectors
const { makeGetTableMetadatas } = lineupSelectors
const { getPlaying, getUid, getCurrentTrack } = playerSelectors

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
  isPublishing?: boolean
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
  isPublishing,
  ...detailsTileProps
}: CollectionScreenDetailsTileProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(tracksActions.fetchLineupMetadatas(0, 200, false, undefined))
  }, [dispatch])

  const tracksLineup = useSelector(getTracksLineup)
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
  const playingUid = useSelector(getUid)
  const playingTrack = useSelector(getCurrentTrack)
  const trackId = playingTrack?.track_id

  const isQueued = tracksLineup.entries.some(
    (entry) => playingUid === entry.uid
  )

  const handlePressPlay = useCallback(() => {
    if (isPlaying && isQueued) {
      dispatch(tracksActions.pause())
      recordPlay(trackId, false)
    } else if (!isPlaying && isQueued) {
      dispatch(tracksActions.play())
      recordPlay(trackId)
    } else if (tracksLineup.entries.length > 0) {
      dispatch(tracksActions.play(tracksLineup.entries[0].uid))
      recordPlay(tracksLineup.entries[0].track_id)
    }
  }, [dispatch, isPlaying, trackId, tracksLineup, isQueued])

  const handlePressTrackListItemPlay = useCallback(
    (uid: UID, id: ID) => {
      if (isPlaying && playingUid === uid) {
        dispatch(tracksActions.pause())
        recordPlay(id, false)
      } else if (playingUid !== uid) {
        dispatch(tracksActions.play(uid))
        recordPlay(id)
      } else {
        dispatch(tracksActions.play())
        recordPlay(id)
      }
    },
    [dispatch, isPlaying, playingUid]
  )

  const headerText = useMemo(() => {
    if (isPublishing) {
      return messages.publishing
    }

    if (isAlbum) {
      return messages.album
    }

    if (isPrivate) {
      return messages.privatePlaylist
    }

    return messages.playlist
  }, [isAlbum, isPrivate, isPublishing])

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
