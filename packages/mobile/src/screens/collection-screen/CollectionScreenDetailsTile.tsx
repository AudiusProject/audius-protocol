import { useCallback, useEffect } from 'react'

import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { Name, PlaybackSource, Status } from '@audius/common/models'
import type {
  SmartCollectionVariant,
  ID,
  UID,
  AccessConditions
} from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors,
  reachabilitySelectors,
  playerSelectors,
  cacheTracksSelectors,
  PurchaseableContentType,
  queueActions
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import type { Maybe, Nullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'
import { createSelector } from 'reselect'

import { Box } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { DetailsTile } from 'app/components/details-tile'
import type {
  DetailsTileDetail,
  DetailsTileProps
} from 'app/components/details-tile/types'
import { TrackList } from 'app/components/track-list'
import { make, track } from 'app/services/analytics'
import type { AppState } from 'app/store'
import { makeStyles } from 'app/styles'

const { getPlaying, getPreviewing, getUid, getCurrentTrack } = playerSelectors
const { getIsReachable } = reachabilitySelectors
const { getCollectionTracksLineup } = collectionPageSelectors
const { getCollection } = cacheCollectionsSelectors
const { getTracks } = cacheTracksSelectors

const selectTrackUids = createSelector(
  (state: AppState) => getCollectionTracksLineup(state).entries,
  (entries) => entries.map(({ uid }) => uid)
)

const selectFirstTrack = (state: AppState) =>
  getCollectionTracksLineup(state).entries[0]

const selectTrackCount = (state: AppState) => {
  return getCollectionTracksLineup(state).entries.length
}

const selectIsLineupLoading = (state: AppState) => {
  return getCollectionTracksLineup(state).status !== Status.SUCCESS
}

const selectCollectionDuration = createSelector(
  (state: AppState) => getCollectionTracksLineup(state).entries,
  (state: AppState) => state.tracks.entries,
  (entries, tracks) => {
    return entries
      .map((entry) => tracks[entry.id]?.metadata.duration)
      .filter(removeNullable)
      .reduce((totalDuration, trackDuration) => {
        return totalDuration + trackDuration
      }, 0)
  }
)

const selectIsQueued = createSelector(
  selectTrackUids,
  getUid,
  (trackUids, playingUid) => {
    return trackUids.some((trackUid) => playingUid === trackUid)
  }
)

const useRefetchLineupOnTrackAdd = (
  collectionId: ID | SmartCollectionVariant
) => {
  const trackCount = useSelector((state) =>
    typeof collectionId !== 'number'
      ? 0
      : getCollection(state, { id: collectionId })?.playlist_contents.track_ids
          .length
  )

  const previousTrackCount = usePrevious(trackCount)
  const dispatch = useDispatch()

  useEffect(() => {
    if (previousTrackCount && previousTrackCount !== trackCount) {
      dispatch(tracksActions.fetchLineupMetadatas(0, 200, false))
    }
  }, [previousTrackCount, trackCount, dispatch])
}

const getMessages = (
  collectionType: 'album' | 'playlist',
  isPremium = false
) => ({
  empty: `This ${collectionType} is empty. Start adding tracks to share it or make it public.`,
  emptyPublic: `This ${collectionType} is empty`,
  detailsPlaceholder: '---',
  collectionType: `${isPremium ? 'premium ' : ''}${collectionType}`,
  hiddenType: `Hidden ${collectionType}`
})

const useStyles = makeStyles(({ palette, spacing }) => ({
  empty: {
    color: palette.neutral,
    paddingHorizontal: spacing(8),
    marginBottom: spacing(8),
    textAlign: 'center',
    lineHeight: 20
  }
}))

type CollectionScreenDetailsTileProps = {
  isAlbum?: boolean
  isPrivate?: boolean
  isOwner?: boolean
  isPublishing?: boolean
  isDeleted?: boolean
  extraDetails?: DetailsTileDetail[]
  collectionId: number | SmartCollectionVariant
  hasStreamAccess?: boolean
  streamConditions?: Nullable<AccessConditions>
} & Omit<
  DetailsTileProps,
  | 'descriptionLinkPressSource'
  | 'details'
  | 'headerText'
  | 'onPressPlay'
  | 'onPressPreview'
  | 'collectionId'
  | 'contentType'
>

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
  collectionId,
  isAlbum,
  isPrivate,
  isPublishing,
  renderImage,
  trackCount: trackCountProp,
  isOwner,
  hideOverflow,
  hideRepost,
  hideFavorite,
  hasStreamAccess,
  streamConditions,
  ddexApp,
  isDeleted,
  ...detailsTileProps
}: CollectionScreenDetailsTileProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()

  const isReachable = useSelector(getIsReachable)

  const { data: currentUserId } = useGetCurrentUserId({})
  // Since we're supporting SmartCollections, need to explicitly check that
  // collectionId is a number before fetching the playlist. -1 is a placeholder,
  // the request should not go out as the hook is disabled in that case.
  const { data: collection } = useGetPlaylistById(
    {
      playlistId: typeof collectionId === 'number' ? collectionId : -1,
      currentUserId
    },
    { disabled: typeof collectionId !== 'number' }
  )
  const isStreamGated = collection?.is_stream_gated

  const trackUids = useSelector(selectTrackUids)
  const collectionTrackCount = useSelector(selectTrackCount)
  const trackCount = trackCountProp ?? collectionTrackCount
  const isLineupLoading = useSelector(selectIsLineupLoading)
  const collectionDuration = useSelector(selectCollectionDuration)
  const playingUid = useSelector(getUid)
  const isQueued = useSelector(selectIsQueued)
  const isPlaying = useSelector(getPlaying)
  const isPreviewing = useSelector(getPreviewing)
  const playingTrack = useSelector(getCurrentTrack)
  const playingTrackId = playingTrack?.track_id
  const firstTrack = useSelector(selectFirstTrack)
  const messages = getMessages(isAlbum ? 'album' : 'playlist', isStreamGated)
  useRefetchLineupOnTrackAdd(collectionId)

  const play = useCallback(
    ({ isPreview = false }: { isPreview?: boolean } = {}) => {
      if (isPlaying && isQueued && isPreviewing === isPreview) {
        dispatch(tracksActions.pause())
        recordPlay(playingTrackId, false)
      } else if (!isPlaying && isQueued) {
        dispatch(tracksActions.play())
        recordPlay(playingTrackId)
      } else if (trackCount > 0 && firstTrack) {
        dispatch(queueActions.clear({}))
        dispatch(tracksActions.play(firstTrack.uid, { isPreview }))
        recordPlay(firstTrack.id)
      }
    },
    [
      isPlaying,
      isQueued,
      isPreviewing,
      trackCount,
      firstTrack,
      dispatch,
      playingTrackId
    ]
  )

  const handlePressPlay = useCallback(() => play(), [play])
  const handlePressPreview = useCallback(
    () => play({ isPreview: true }),
    [play]
  )

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

  const numericCollectionId =
    typeof collectionId === 'number' ? collectionId : undefined

  const uids = isLineupLoading ? Array(Math.min(5, trackCount ?? 0)) : trackUids
  const tracks = useSelector((state) => getTracks(state, { uids }))
  const areAllTracksDeleted = Object.values(tracks).every(
    (track) => track.is_delete
  )
  const isPlayable =
    Object.values(tracks).length === 0
      ? true
      : !areAllTracksDeleted && (isQueued || (trackCount > 0 && !!firstTrack))

  const renderTrackList = useCallback(() => {
    return (
      <TrackList
        contextPlaylistId={!isAlbum ? numericCollectionId : undefined}
        trackItemAction='overflow'
        showSkeleton={isLineupLoading}
        togglePlay={handlePressTrackListItemPlay}
        isAlbumPage={isAlbum}
        uids={uids}
        ListEmptyComponent={
          isLineupLoading ? null : (
            <Box mt='m'>
              <Text fontSize='medium' weight='medium' style={styles.empty}>
                {isOwner ? messages.empty : messages.emptyPublic}
              </Text>
            </Box>
          )
        }
      />
    )
  }, [
    numericCollectionId,
    isAlbum,
    handlePressTrackListItemPlay,
    isLineupLoading,
    styles,
    uids,
    isOwner,
    messages
  ])

  return (
    <DetailsTile
      {...detailsTileProps}
      contentId={numericCollectionId}
      contentType={PurchaseableContentType.ALBUM}
      ddexApp={ddexApp}
      description={description}
      descriptionLinkPressSource='collection page'
      duration={collectionDuration}
      hideOverflow={hideOverflow || !isReachable}
      hidePlayCount={true}
      hasStreamAccess={hasStreamAccess}
      streamConditions={streamConditions}
      hideFavorite={hideFavorite || !hasStreamAccess}
      hideRepost={hideRepost || !isReachable || !hasStreamAccess}
      isPlaying={isPlaying && isQueued}
      isPreviewing={isPreviewing && isQueued}
      isPublished={!isPrivate || isPublishing}
      isDeleted={isDeleted}
      isCollection={true}
      renderBottomContent={renderTrackList}
      headerText={isPrivate ? messages.hiddenType : messages.collectionType}
      renderImage={renderImage}
      onPressPlay={handlePressPlay}
      onPressPreview={handlePressPreview}
      isPlayable={isPlayable}
      trackCount={trackCount}
    />
  )
}
