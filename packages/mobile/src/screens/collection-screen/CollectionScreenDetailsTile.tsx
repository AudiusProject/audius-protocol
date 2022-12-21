import { useCallback, useMemo } from 'react'

import type { Collection, ID, Maybe, UID } from '@audius/common'
import {
  useProxySelector,
  collectionPageActions,
  playerSelectors,
  Status,
  Name,
  PlaybackSource,
  formatSecondsAsText,
  lineupSelectors,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors
} from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import type { DynamicImageProps } from 'app/components/core'
import { Text } from 'app/components/core'
import { DetailsTile } from 'app/components/details-tile'
import type {
  DetailsTileDetail,
  DetailsTileProps
} from 'app/components/details-tile/types'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { DownloadToggle } from 'app/components/offline-downloads'
import { TrackList } from 'app/components/track-list'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useOfflineCollectionLineup } from 'app/hooks/useLoadOfflineTracks'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { formatCount } from 'app/utils/format'
const {
  getCollection,
  getCollectionTracksLineup,
  getCollectionId,
  getCollectionUid,
  getUserUid
} = collectionPageSelectors
const { resetCollection } = collectionPageActions
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

const recordPlay = (id: Maybe<number>, play = true) => {
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
  renderImage: renderCustomImage,
  ...detailsTileProps
}: CollectionScreenDetailsTileProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()

  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const collection = useSelector(getCollection)
  const collectionUid = useSelector(getCollectionUid)
  const collectionId = useSelector(getCollectionId)
  const userUid = useSelector(getUserUid)
  const { entries, status } = useProxySelector(getTracksLineup, [])
  const tracksLoading = status === Status.LOADING
  const numTracks = entries.length

  const resetCollectionLineup = useCallback(() => {
    dispatch(resetCollection(collectionUid, userUid))
    dispatch(tracksActions.fetchLineupMetadatas(0, 200, false, undefined))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  useFocusEffect(resetCollectionLineup)
  useOfflineCollectionLineup(collectionId?.toString())

  const duration = entries?.reduce(
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

  const isQueued = entries.some((entry) => playingUid === entry.uid)

  const renderImage = useCallback(
    (props: DynamicImageProps) => (
      <CollectionImage collection={collection as Collection} {...props} />
    ),
    [collection]
  )

  const handlePressPlay = useCallback(() => {
    if (isPlaying && isQueued) {
      dispatch(tracksActions.pause())
      recordPlay(trackId, false)
    } else if (!isPlaying && isQueued) {
      dispatch(tracksActions.play())
      recordPlay(trackId)
    } else if (entries.length > 0) {
      dispatch(tracksActions.play(entries[0].uid))
      recordPlay(entries[0].track_id)
    }
  }, [dispatch, isPlaying, trackId, entries, isQueued])

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

  const tracksForDownload = useMemo(
    () =>
      entries.map((track) => ({
        trackId: track.track_id,
        downloadReason: {
          is_from_favorites: false,
          collection_id: collectionId?.toString()
        }
      })),
    [collectionId, entries]
  )

  const renderHeader = useCallback(
    () => (
      <DownloadToggle
        collectionId={collectionId}
        tracksForDownload={tracksForDownload}
        labelText={headerText}
      />
    ),
    [collectionId, headerText, tracksForDownload]
  )

  const renderTrackList = () => {
    if (tracksLoading)
      return (
        <>
          <View style={styles.trackListDivider} />
          <TrackList hideArt showDivider showSkeleton tracks={Array(20)} />
        </>
      )

    return entries.length === 0 ? (
      <Text style={styles.empty}>{messages.empty}</Text>
    ) : (
      <>
        <View style={styles.trackListDivider} />
        <TrackList
          hideArt
          showDivider
          togglePlay={handlePressTrackListItemPlay}
          tracks={entries}
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
      hideListenCount={true}
      isPlaying={isPlaying && isQueued}
      renderBottomContent={renderTrackList}
      headerText={!isOfflineModeEnabled ? headerText : undefined}
      renderHeader={isOfflineModeEnabled ? renderHeader : undefined}
      renderImage={renderCustomImage ?? renderImage}
      onPressPlay={handlePressPlay}
    />
  )
}
