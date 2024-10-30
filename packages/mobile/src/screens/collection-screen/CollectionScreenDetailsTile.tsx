import { useCallback, useEffect } from 'react'

import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import {
  Name,
  PlaybackSource,
  Status,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import type {
  SmartCollectionVariant,
  ID,
  UID,
  AccessConditions
} from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import {
  cacheCollectionsSelectors,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors,
  reachabilitySelectors,
  playerSelectors,
  cacheTracksSelectors,
  PurchaseableContentType,
  queueActions,
  collectionPageActions
} from '@audius/common/store'
import { formatReleaseDate, getDogEarType } from '@audius/common/utils'
import type { Maybe, Nullable } from '@audius/common/utils'
import dayjs from 'dayjs'
import { TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'
import { createSelector } from 'reselect'
import { useGatedContentAccessMap } from '~/hooks'

import {
  Box,
  Button,
  Divider,
  Flex,
  IconCalendarMonth,
  IconPause,
  IconPlay,
  IconVisibilityHidden,
  MusicBadge,
  Paper,
  Text,
  spacing
} from '@audius/harmony-native'
import { DogEar, UserGeneratedText } from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { CollectionMetadataList } from 'app/components/details-tile/CollectionMetadataList'
import { DetailsTileActionButtons } from 'app/components/details-tile/DetailsTileActionButtons'
import { DetailsTileHasAccess } from 'app/components/details-tile/DetailsTileHasAccess'
import { DetailsTileNoAccess } from 'app/components/details-tile/DetailsTileNoAccess'
import { DetailsTileStats } from 'app/components/details-tile/DetailsTileStats'
import type { DetailsTileProps } from 'app/components/details-tile/types'
import { OfflineStatusRow } from 'app/components/offline-downloads'
import { TrackList } from 'app/components/track-list'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { make, track } from 'app/services/analytics'
import type { AppState } from 'app/store'
import { makeStyles } from 'app/styles'

import { useFetchCollectionLineup } from './useFetchCollectionLineup'

const { getPlaying, getPreviewing, getUid, getCurrentTrack } = playerSelectors
const { getIsReachable } = reachabilitySelectors
const { getCollectionTracksLineup } = collectionPageSelectors
const { getCollection, getCollectionTracks } = cacheCollectionsSelectors
const { getTracks } = cacheTracksSelectors
const { resetCollection, fetchCollection } = collectionPageActions

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
  play: 'Play',
  pause: 'Pause',
  resume: 'Resume',
  replay: 'Replay',
  preview: 'Preview',
  hidden: 'Hidden',
  releases: (releaseDate: string) =>
    `Releases ${formatReleaseDate({ date: releaseDate, withHour: true })}`
})

const useStyles = makeStyles(({ palette, spacing }) => ({
  empty: {
    color: palette.neutral,
    paddingHorizontal: spacing(8),
    marginBottom: spacing(8),
    textAlign: 'center',
    lineHeight: 20
  },
  coverArt: {
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2),
    height: 224,
    width: 224,
    alignSelf: 'center'
  }
}))

type CollectionScreenDetailsTileProps = {
  isAlbum?: boolean
  isOwner?: boolean
  isPublishing?: boolean
  isDeleted?: boolean
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
  collectionId,
  isAlbum,
  isPublishing,
  renderImage,
  trackCount: trackCountProp,
  isOwner = false,
  hideOverflow,
  hideActions,
  hasStreamAccess,
  streamConditions,
  ddexApp,
  playCount,
  hidePlayCount,
  hideFavoriteCount,
  hideRepostCount,
  repostCount,
  saveCount,
  hasSaved,
  title,
  hasReposted,
  onPressEdit,
  onPressFavorites,
  onPressOverflow,
  onPressPublish,
  onPressRepost,
  onPressReposts,
  onPressSave,
  onPressShare,
  user,
  releaseDate
}: CollectionScreenDetailsTileProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useNavigation()

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
  const {
    is_stream_gated: isStreamGated,
    is_scheduled_release: isScheduledRelease,
    is_private: isPrivate
  } = collection ?? {}

  const numericCollectionId =
    typeof collectionId === 'number' ? collectionId : undefined
  const collectionTracks = useSelector((state: CommonState) =>
    getCollectionTracks(state, { id: numericCollectionId })
  )
  const trackAccessMap = useGatedContentAccessMap(collectionTracks ?? [])
  const doesUserHaveAccessToAnyTrack = Object.values(trackAccessMap).some(
    ({ hasStreamAccess }) => hasStreamAccess
  )
  const trackUids = useSelector(selectTrackUids)
  const collectionTrackCount = useSelector(selectTrackCount)
  const trackCount = trackCountProp ?? collectionTrackCount
  const isLineupLoading = useSelector(selectIsLineupLoading)
  const isQueued = useSelector(selectIsQueued)
  const isPlaybackActive = useSelector(getPlaying)
  const isPlaying = isPlaybackActive && isQueued
  const isPreviewing = useSelector(getPreviewing)
  const isPlayingPreview = isPreviewing && isPlaying
  const playingTrack = useSelector(getCurrentTrack)
  const playingTrackId = playingTrack?.track_id
  const firstTrack = useSelector(selectFirstTrack)
  const messages = getMessages(isAlbum ? 'album' : 'playlist', isStreamGated)
  const isPublished = !isPrivate || isPublishing
  const shouldShowScheduledRelease =
    isScheduledRelease &&
    isPrivate &&
    releaseDate &&
    dayjs(releaseDate).isAfter(dayjs())
  const shouldHideOverflow =
    hideOverflow || !isReachable || (isPrivate && !isOwner)
  const shouldHideActions =
    hideActions || (isPrivate && !isOwner) || !hasStreamAccess
  const shouldeHideShare = hideActions || (isPrivate && !isOwner)
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)

  const uids = isLineupLoading ? Array(Math.min(5, trackCount ?? 0)) : trackUids
  const tracks = useSelector((state) => getTracks(state, { uids }))
  const areAllTracksDeleted = Object.values(tracks).every(
    (track) => track.is_delete
  )
  const isPlayable =
    Object.values(tracks).length === 0
      ? true
      : !areAllTracksDeleted && (isQueued || (trackCount > 0 && !!firstTrack))

  const shouldShowPlay =
    !numericCollectionId ||
    (isPlayable && hasStreamAccess) ||
    doesUserHaveAccessToAnyTrack
  const shouldShowPreview =
    isUSDCPurchaseGated && !hasStreamAccess && !shouldShowPlay

  useEffect(() => {
    dispatch(resetCollection())
  }, [dispatch])

  useRefetchLineupOnTrackAdd(collectionId)

  const badges = [
    shouldShowScheduledRelease ? (
      <MusicBadge variant='accent' icon={IconCalendarMonth}>
        {messages.releases(releaseDate)}
      </MusicBadge>
    ) : isPrivate ? (
      <MusicBadge icon={IconVisibilityHidden}>{messages.hidden}</MusicBadge>
    ) : null
  ].filter((badge) => badge !== null)

  const imageElement = renderImage({
    style: styles.coverArt
  })

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

  const renderDogEar = () => {
    const dogEarType = getDogEarType({
      isOwner,
      streamConditions
    })
    return dogEarType ? <DogEar type={dogEarType} borderOffset={1} /> : null
  }

  const handlePressArtistName = useCallback(() => {
    if (!user) {
      return
    }
    navigation.push('Profile', { handle: user.handle })
  }, [navigation, user])

  const PreviewButton = () => (
    <Button
      variant='tertiary'
      iconLeft={isPlayingPreview ? IconPause : IconPlay}
      onPress={handlePressPreview}
      disabled={!isPlayable}
      fullWidth
    >
      {isPlayingPreview ? messages.pause : messages.preview}
    </Button>
  )

  return (
    <Paper mb='2xl' style={{ overflow: 'hidden' }}>
      <ScreenPrimaryContent>
        {renderDogEar()}
        <Flex p='l' gap='l' alignItems='center' w='100%'>
          <Text
            variant='label'
            size='m'
            strength='default'
            textTransform='uppercase'
            color='subdued'
          >
            {messages.collectionType}
          </Text>

          {badges.length > 0 ? (
            <Flex direction='row' gap='s'>
              {badges.map((badge) => badge)}
            </Flex>
          ) : null}
          {imageElement}
          <Flex gap='xs' alignItems='center'>
            <Text variant='heading' size='s' textAlign='center'>
              {title}
            </Text>
            {user ? (
              <TouchableOpacity onPress={handlePressArtistName}>
                <Flex direction='row' gap='xs'>
                  <Text variant='body' color='accent' size='l'>
                    {user.name}
                  </Text>
                  <UserBadges badgeSize={spacing.l} user={user} hideName />
                </Flex>
              </TouchableOpacity>
            ) : null}
          </Flex>
          {shouldShowPlay ? (
            <Button
              iconLeft={isPlaying ? IconPause : IconPlay}
              onPress={handlePressPlay}
              disabled={!isPlayable}
              fullWidth
            >
              {isPlaying ? messages.pause : messages.play}
            </Button>
          ) : null}
          {shouldShowPreview ? <PreviewButton /> : null}
          <DetailsTileActionButtons
            ddexApp={ddexApp}
            hasReposted={!!hasReposted}
            hasSaved={!!hasSaved}
            hideFavorite={shouldHideActions}
            hideOverflow={shouldHideOverflow}
            hideRepost={shouldHideActions}
            hideShare={shouldeHideShare}
            isOwner={isOwner}
            isCollection
            collectionId={numericCollectionId}
            isPublished={isPublished}
            onPressEdit={onPressEdit}
            onPressOverflow={onPressOverflow}
            onPressRepost={onPressRepost}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
            onPressPublish={onPressPublish}
          />
        </Flex>
        <Flex
          p='l'
          gap='l'
          alignItems='center'
          borderTop='default'
          backgroundColor='surface1'
          borderBottomLeftRadius='m'
          borderBottomRightRadius='m'
        >
          {!hasStreamAccess &&
          !isOwner &&
          streamConditions &&
          numericCollectionId ? (
            <DetailsTileNoAccess
              trackId={numericCollectionId}
              contentType={PurchaseableContentType.ALBUM}
              streamConditions={streamConditions}
            />
          ) : null}
          {(hasStreamAccess || isOwner) && streamConditions ? (
            <DetailsTileHasAccess
              streamConditions={streamConditions}
              isOwner={isOwner}
              trackArtist={user}
              contentType={PurchaseableContentType.ALBUM}
            />
          ) : null}
          {isPublished && numericCollectionId ? (
            <DetailsTileStats
              playCount={playCount}
              hidePlayCount={hidePlayCount}
              favoriteCount={saveCount}
              hideFavoriteCount={hideFavoriteCount}
              repostCount={repostCount}
              hideRepostCount={hideRepostCount}
              onPressFavorites={onPressFavorites}
              onPressReposts={onPressReposts}
            />
          ) : null}
          {description ? (
            <Box w='100%'>
              <UserGeneratedText
                source={'collection page'}
                variant='body'
                size='s'
              >
                {description}
              </UserGeneratedText>
            </Box>
          ) : null}
          {numericCollectionId ? (
            <CollectionMetadataList collectionId={numericCollectionId} />
          ) : null}
          <OfflineStatusRow contentId={numericCollectionId} isCollection />
        </Flex>
      </ScreenPrimaryContent>
      <ScreenSecondaryContent>
        <Divider />
        <CollectionTrackList
          isAlbum={isAlbum}
          isOwner={isOwner}
          isPlaying={isPlaying}
          collectionId={collectionId}
          isLineupLoading={isLineupLoading}
          uids={uids}
        />
      </ScreenSecondaryContent>
    </Paper>
  )
}

type CollectionTrackListProps = Pick<
  CollectionScreenDetailsTileProps,
  'isAlbum' | 'isOwner' | 'isPlaying' | 'collectionId'
> & {
  isLineupLoading: boolean
  uids: UID[]
}

const CollectionTrackList = ({
  isAlbum,
  isOwner,
  collectionId,
  isLineupLoading,
  isPlaying,
  uids
}: CollectionTrackListProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const playingUid = useSelector(getUid)
  const messages = getMessages(isAlbum ? 'album' : 'playlist')

  const numericCollectionId =
    typeof collectionId === 'number' ? collectionId : undefined

  const { params } = useRoute<'Collection'>()
  const { slug, collectionType, handle } = params ?? {}
  const permalink = slug ? `/${handle}/${collectionType}/${slug}` : undefined

  const handleFetchCollection = useCallback(() => {
    dispatch(resetCollection())
    dispatch(fetchCollection(collectionId as number, permalink, true))
  }, [dispatch, collectionId, permalink])

  useFetchCollectionLineup(collectionId, handleFetchCollection)

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
            <Text variant='body' style={styles.empty}>
              {isOwner ? messages.empty : messages.emptyPublic}
            </Text>
          </Box>
        )
      }
    />
  )
}
