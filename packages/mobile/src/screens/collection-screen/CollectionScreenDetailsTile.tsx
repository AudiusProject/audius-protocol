import { useCallback, useEffect, useMemo } from 'react'

import { Name, PlaybackSource, Status } from '@audius/common/models'
import type { SmartCollectionVariant, ID, UID } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors,
  reachabilitySelectors,
  playerSelectors
} from '@audius/common/store'
import { formatSecondsAsText, removeNullable } from '@audius/common/utils'
import type { Maybe } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'
import { createSelector } from 'reselect'

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
import { formatCount } from 'app/utils/format'

import { CollectionHeader } from './CollectionHeader'
const { getPlaying, getUid, getCurrentTrack } = playerSelectors
const { getIsReachable } = reachabilitySelectors
const { getCollectionTracksLineup } = collectionPageSelectors
const { getCollection } = cacheCollectionsSelectors

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
  return getCollectionTracksLineup(state).status === Status.LOADING
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

const getMessages = (collectionType: 'album' | 'playlist') => ({
  empty: `This ${collectionType} is empty. Start adding tracks to share it or make it public.`,
  emptyPublic: `This ${collectionType} is empty`,
  detailsPlaceholder: '---'
})

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  trackListDivider: {
    marginHorizontal: spacing(6),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight7
  },
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
  extraDetails?: DetailsTileDetail[]
  collectionId: number | SmartCollectionVariant
} & Omit<
  DetailsTileProps,
  | 'descriptionLinkPressSource'
  | 'details'
  | 'headerText'
  | 'onPressPlay'
  | 'onPressPreview'
  | 'collectionId'
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
  ...detailsTileProps
}: CollectionScreenDetailsTileProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()

  const isReachable = useSelector(getIsReachable)

  const trackUids = useSelector(selectTrackUids)
  const collectionTrackCount = useSelector(selectTrackCount)
  const trackCount = trackCountProp ?? collectionTrackCount
  const isLineupLoading = useSelector(selectIsLineupLoading)
  const collectionDuration = useSelector(selectCollectionDuration)
  const playingUid = useSelector(getUid)
  const isQueued = useSelector(selectIsQueued)
  const isPlaying = useSelector(getPlaying)
  const playingTrack = useSelector(getCurrentTrack)
  const playingTrackId = playingTrack?.track_id
  const firstTrack = useSelector(selectFirstTrack)
  const messages = getMessages(isAlbum ? 'album' : 'playlist')
  useRefetchLineupOnTrackAdd(collectionId)

  const details = useMemo(() => {
    if (!isLineupLoading && trackCount === 0) return []
    return [
      {
        label: 'Tracks',
        value: isLineupLoading
          ? messages.detailsPlaceholder
          : formatCount(trackCount)
      },
      {
        label: 'Duration',
        value: isLineupLoading
          ? messages.detailsPlaceholder
          : formatSecondsAsText(collectionDuration)
      },
      ...extraDetails
    ].filter(({ isHidden, value }) => !isHidden && !!value)
  }, [
    isLineupLoading,
    trackCount,
    messages.detailsPlaceholder,
    collectionDuration,
    extraDetails
  ])

  const handlePressPlay = useCallback(() => {
    if (isPlaying && isQueued) {
      dispatch(tracksActions.pause())
      recordPlay(playingTrackId, false)
    } else if (!isPlaying && isQueued) {
      dispatch(tracksActions.play())
      recordPlay(playingTrackId)
    } else if (trackCount > 0 && firstTrack) {
      dispatch(tracksActions.play(firstTrack.uid))
      recordPlay(firstTrack.id)
    }
  }, [dispatch, isPlaying, playingTrackId, isQueued, trackCount, firstTrack])

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

  const renderHeader = useCallback(
    () => <CollectionHeader collectionId={collectionId} />,
    [collectionId]
  )

  const numericCollectionId =
    typeof collectionId === 'number' ? collectionId : undefined

  const renderTrackList = useCallback(() => {
    return (
      <TrackList
        contextPlaylistId={!isAlbum ? numericCollectionId : undefined}
        trackItemAction='overflow'
        showDivider
        showSkeleton={isLineupLoading}
        togglePlay={handlePressTrackListItemPlay}
        isAlbumPage={isAlbum}
        uids={isLineupLoading ? Array(Math.min(5, trackCount ?? 0)) : trackUids}
        ListEmptyComponent={
          isLineupLoading ? null : (
            <Text fontSize='medium' weight='medium' style={styles.empty}>
              {isOwner ? messages.empty : messages.emptyPublic}
            </Text>
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
    trackUids,
    trackCount,
    isOwner
  ])

  const isPlayable = isQueued || (trackCount > 0 && !!firstTrack)

  return (
    <DetailsTile
      {...detailsTileProps}
      collectionId={numericCollectionId}
      description={description}
      descriptionLinkPressSource='collection page'
      details={details}
      hideOverflow={hideOverflow || !isReachable}
      hideListenCount={true}
      hideRepost={hideRepost || !isReachable}
      isPlaying={isPlaying && isQueued}
      isPublished={!isPrivate || isPublishing}
      isCollection={true}
      renderBottomContent={renderTrackList}
      renderHeader={renderHeader}
      renderImage={renderImage}
      onPressPlay={handlePressPlay}
      isPlayable={isPlayable}
    />
  )
}
