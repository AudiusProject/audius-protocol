import React, { useCallback } from 'react'

import { useGatedContentAccess } from '@audius/common/hooks'
import {
  Name,
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  FavoriteType,
  SquareSizes,
  isContentUSDCPurchaseGated,
  isContentCollectibleGated
} from '@audius/common/models'
import type {
  UID,
  SearchUser,
  SearchTrack,
  Track,
  User
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type { CommonState } from '@audius/common/store'
import {
  accountSelectors,
  trackPageLineupActions,
  queueSelectors,
  reachabilitySelectors,
  tracksSocialActions,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  OverflowAction,
  OverflowSource,
  repostsUserListActions,
  favoritesUserListActions,
  trackPageActions,
  RepostType,
  playerSelectors,
  playbackPositionSelectors,
  PurchaseableContentType,
  usePublishConfirmationModal,
  useEarlyReleaseConfirmationModal
} from '@audius/common/store'
import { formatReleaseDate, Genre, removeNullable } from '@audius/common/utils'
import dayjs from 'dayjs'
import { TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import {
  Box,
  Button,
  Divider,
  Flex,
  IconCalendarMonth,
  IconPause,
  IconPlay,
  IconRepeatOff,
  IconVisibilityHidden,
  MusicBadge,
  Paper,
  Text,
  spacing,
  type ImageProps
} from '@audius/harmony-native'
import CoSign, { Size } from 'app/components/co-sign'
import { useCommentDrawer } from 'app/components/comments/CommentDrawerContext'
import { Tag, UserGeneratedText } from 'app/components/core'
import { DeletedTile } from 'app/components/details-tile/DeletedTile'
import { DetailsProgressInfo } from 'app/components/details-tile/DetailsProgressInfo'
import { DetailsTileActionButtons } from 'app/components/details-tile/DetailsTileActionButtons'
import { DetailsTileAiAttribution } from 'app/components/details-tile/DetailsTileAiAttribution'
import { DetailsTileHasAccess } from 'app/components/details-tile/DetailsTileHasAccess'
import { DetailsTileNoAccess } from 'app/components/details-tile/DetailsTileNoAccess'
import { DetailsTileStats } from 'app/components/details-tile/DetailsTileStats'
import { TrackMetadataList } from 'app/components/details-tile/TrackMetadataList'
import { TrackImage } from 'app/components/image/TrackImage'
import { OfflineStatusRow } from 'app/components/offline-downloads'
import { TrackDogEar } from 'app/components/track/TrackDogEar'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { make, track as trackEvent } from 'app/services/analytics'
import { makeStyles } from 'app/styles'

import { DownloadSection } from './DownloadSection'
const { getPlaying, getTrackId, getPreviewing } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const { tracksActions } = trackPageLineupActions
const { getUserId } = accountSelectors
const { getIsReachable } = reachabilitySelectors
const { getTrackPosition } = playbackPositionSelectors
const { makeGetCurrent } = queueSelectors
const getCurrentQueueItem = makeGetCurrent()

const messages = {
  track: 'track',
  podcast: 'podcast',
  remix: 'remix',
  collectibleGated: 'collectible gated',
  specialAccess: 'special access',
  premiumTrack: 'premium track',
  generatedWithAi: 'generated with ai',
  trackDeleted: 'track [deleted by artist]',
  play: 'Play',
  pause: 'Pause',
  resume: 'Resume',
  replay: 'Replay',
  preview: 'Preview',
  hidden: 'Hidden',
  releases: (releaseDate: string) =>
    `Releases ${formatReleaseDate({ date: releaseDate, withHour: true })}`
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  coverArt: {
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2),
    height: 224,
    width: 224,
    alignSelf: 'center'
  }
}))

type TrackScreenDetailsTileProps = {
  track: Track | SearchTrack
  user: User | SearchUser
  uid: UID
  isLineupLoading: boolean
}

const recordPlay = (id, play = true, isPreview = false) => {
  trackEvent(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.TRACK_PAGE,
      isPreview
    })
  )
}

export const TrackScreenDetailsTile = ({
  track,
  user,
  uid,
  isLineupLoading
}: TrackScreenDetailsTileProps) => {
  const styles = useStyles()
  const { hasStreamAccess } = useGatedContentAccess(track as Track) // track is of type Track | SearchTrack but we only care about some of their common fields, maybe worth refactoring later
  const navigation = useNavigation()

  const isReachable = useSelector(getIsReachable)
  const currentUserId = useSelector(getUserId)
  const dispatch = useDispatch()
  const playingId = useSelector(getTrackId)
  const isPlaybackActive = useSelector(getPlaying)
  const isPreviewing = useSelector(getPreviewing)
  const isPlayingId = playingId === track.track_id
  const isPlaying = isPlaybackActive && isPlayingId
  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId, userId: currentUserId })
  )
  const isCurrentTrack = useSelector((state: CommonState) => {
    return track && track.track_id === getTrackId(state)
  })
  const { onOpen: openPublishConfirmation } = usePublishConfirmationModal()
  const { onOpen: openEarlyReleaseConfirmation } =
    useEarlyReleaseConfirmationModal()

  const {
    _co_sign: coSign,
    description,
    genre,
    has_current_user_reposted: hasReposted,
    has_current_user_saved: hasSaved,
    is_unlisted: isUnlisted,
    is_stream_gated: isStreamGated,
    owner_id: ownerId,
    play_count: playCount,
    remix_of: remixOf,
    repost_count: repostCount,
    save_count: saveCount,
    comment_count: commentCount,
    comments_disabled: commentsDisabled,
    title,
    track_id: trackId,
    stream_conditions: streamConditions,
    ddex_app: ddexApp,
    is_delete: isDeleted,
    release_date: releaseDate,
    is_scheduled_release: isScheduledRelease,
    _is_publishing,
    preview_cid,
    album_backlink
  } = track as Track

  const isOwner = ownerId === currentUserId
  const hideFavorite = isUnlisted || !hasStreamAccess
  const hideRepost = isUnlisted || !isReachable || !hasStreamAccess
  const hideOverflow = !isReachable || (isUnlisted && !isOwner)
  const hideShare = isUnlisted && !isOwner

  const remixParentTrackId = remixOf?.tracks?.[0]?.parent_track_id
  const isRemix = !!remixParentTrackId
  const hasDownloadableAssets =
    (track as Track)?.is_downloadable ||
    ((track as Track)?._stems?.length ?? 0) > 0

  const { open: openCommentDrawer } = useCommentDrawer()

  const isLongFormContent =
    track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS
  const aiAttributionUserId = track?.ai_attribution_user_id
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  const { isEnabled: isCommentsEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const isPlayingPreview = isPreviewing && isPlaying
  const isPlayingFullAccess = isPlaying && !isPreviewing
  const shouldShowScheduledRelease =
    isScheduledRelease &&
    isUnlisted &&
    releaseDate &&
    dayjs(releaseDate).isAfter(dayjs())
  const shouldShowPreview =
    isUSDCPurchaseGated && (isOwner || !hasStreamAccess) && preview_cid
  const shouldHideFavoriteCount =
    isUnlisted || (!isOwner && (saveCount ?? 0) <= 0)
  const shouldHideRepostCount =
    isUnlisted || (!isOwner && (repostCount ?? 0) <= 0)
  const shouldHideCommentCount =
    !isCommentsEnabled ||
    isUnlisted ||
    commentsDisabled ||
    (!isOwner && (commentCount ?? 0) <= 0)
  const shouldHidePlayCount =
    (!isOwner && isUnlisted) ||
    isStreamGated ||
    (!isOwner && (playCount ?? 0) <= 0)

  let headerText
  if (isRemix) {
    headerText = messages.remix
  } else if (isStreamGated) {
    if (isContentCollectibleGated(streamConditions)) {
      headerText = messages.collectibleGated
    } else if (isContentUSDCPurchaseGated(streamConditions)) {
      headerText = messages.premiumTrack
    } else {
      headerText = messages.specialAccess
    }
  } else {
    headerText = messages.track
  }

  const PlayIcon =
    playbackPositionInfo?.status === 'COMPLETED' && !isCurrentTrack
      ? IconRepeatOff
      : IconPlay

  const badges = [
    aiAttributionUserId ? (
      <DetailsTileAiAttribution userId={aiAttributionUserId} />
    ) : null,
    shouldShowScheduledRelease ? (
      <MusicBadge variant='accent' icon={IconCalendarMonth}>
        {messages.releases(releaseDate)}
      </MusicBadge>
    ) : isUnlisted ? (
      <MusicBadge icon={IconVisibilityHidden}>{messages.hidden}</MusicBadge>
    ) : null
  ].filter((badge) => badge !== null)

  const playText = playbackPositionInfo?.status
    ? playbackPositionInfo?.status === 'IN_PROGRESS' || isCurrentTrack
      ? messages.resume
      : messages.replay
    : messages.play

  const renderImage = useCallback(
    (props: ImageProps) => (
      <TrackImage
        trackId={track.track_id}
        size={SquareSizes.SIZE_480_BY_480}
        {...props}
      />
    ),
    [track]
  )
  const innerImageElement = renderImage({
    style: styles.coverArt
  })

  const imageElement = coSign ? (
    <CoSign size={Size.LARGE}>{innerImageElement}</CoSign>
  ) : (
    innerImageElement
  )

  const currentQueueItem = useSelector(getCurrentQueueItem)
  const play = useCallback(
    ({ isPreview = false } = {}) => {
      if (isLineupLoading) return

      if (isPlaying && isPlayingId && isPreviewing === isPreview) {
        dispatch(tracksActions.pause())
        recordPlay(trackId, false, true)
      } else if (
        currentQueueItem.uid !== uid &&
        currentQueueItem.track &&
        currentQueueItem.track.track_id === trackId
      ) {
        dispatch(tracksActions.play())
        recordPlay(trackId)
      } else {
        dispatch(tracksActions.play(uid, { isPreview }))
        recordPlay(trackId, true, true)
      }
    },
    [
      trackId,
      currentQueueItem,
      uid,
      dispatch,
      isPlaying,
      isPlayingId,
      isPreviewing,
      isLineupLoading
    ]
  )

  const handlePressPlay = useCallback(() => play(), [play])
  const handlePressPreview = useCallback(
    () => play({ isPreview: true }),
    [play]
  )

  const handlePressFavorites = useCallback(() => {
    dispatch(setFavorite(trackId, FavoriteType.TRACK))
    navigation.push('Favorited', {
      id: trackId,
      favoriteType: FavoriteType.TRACK
    })
  }, [dispatch, trackId, navigation])

  const handlePressReposts = useCallback(() => {
    dispatch(setRepost(trackId, RepostType.TRACK))
    navigation.push('Reposts', { id: trackId, repostType: RepostType.TRACK })
  }, [dispatch, trackId, navigation])

  const handlePressComments = useCallback(() => {
    openCommentDrawer({
      entityId: trackId,
      navigation,
      actions: tracksActions,
      uid
    })
    trackEvent(
      make({
        eventName: Name.COMMENTS_CLICK_COMMENT_STAT,
        trackId,
        source: 'track_page'
      })
    )
  }, [openCommentDrawer, trackId, navigation, uid])

  const handlePressSave = () => {
    if (!isOwner) {
      if (hasSaved) {
        dispatch(unsaveTrack(trackId, FavoriteSource.TRACK_PAGE))
      } else {
        dispatch(saveTrack(trackId, FavoriteSource.TRACK_PAGE))
      }
    }
  }

  const handlePressRepost = () => {
    if (!isOwner) {
      if (hasReposted) {
        dispatch(undoRepostTrack(trackId, RepostSource.TRACK_PAGE))
      } else {
        dispatch(repostTrack(trackId, RepostSource.TRACK_PAGE))
      }
    }
  }

  const handlePressShare = () => {
    dispatch(
      requestOpenShareModal({
        type: 'track',
        trackId,
        source: ShareSource.PAGE
      })
    )
  }

  const handlePressArtistName = useCallback(() => {
    if (!user) {
      return
    }
    navigation.push('Profile', { handle: user.handle })
  }, [navigation, user])

  const handlePressTag = useCallback(
    (tag: string) => {
      navigation.push('Search', { query: `#${tag}` })
    },
    [navigation]
  )

  const handlePressEdit = useCallback(() => {
    navigation?.push('EditTrack', { id: trackId })
  }, [navigation, trackId])

  const handlePressOverflow = () => {
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
    const addToAlbumAction =
      isOwner && !ddexApp ? OverflowAction.ADD_TO_ALBUM : null
    const overflowActions = [
      addToAlbumAction,
      !isUnlisted || isOwner ? OverflowAction.ADD_TO_PLAYLIST : null,
      isOwner
        ? null
        : user.does_current_user_follow
        ? OverflowAction.UNFOLLOW_ARTIST
        : OverflowAction.FOLLOW_ARTIST,
      isLongFormContent
        ? playbackPositionInfo?.status === 'COMPLETED'
          ? OverflowAction.MARK_AS_UNPLAYED
          : OverflowAction.MARK_AS_PLAYED
        : null,
      album_backlink ? OverflowAction.VIEW_ALBUM_PAGE : null,
      OverflowAction.VIEW_ARTIST_PAGE,
      isOwner && !ddexApp ? OverflowAction.EDIT_TRACK : null,
      isOwner && isScheduledRelease && isUnlisted
        ? OverflowAction.RELEASE_NOW
        : null,
      isOwner && !ddexApp ? OverflowAction.DELETE_TRACK : null
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: trackId,
        overflowActions
      })
    )
  }

  const publish = useCallback(() => {
    dispatch(trackPageActions.makeTrackPublic(trackId))
  }, [dispatch, trackId])

  const handlePressPublish = useCallback(() => {
    if (isScheduledRelease) {
      openEarlyReleaseConfirmation({
        confirmCallback: publish,
        contentType: 'track'
      })
    } else {
      openPublishConfirmation({
        confirmCallback: publish,
        contentType: 'track'
      })
    }
  }, [
    openPublishConfirmation,
    openEarlyReleaseConfirmation,
    isScheduledRelease,
    publish
  ])

  const renderBottomContent = () => {
    return hasDownloadableAssets ? (
      <>
        <Divider />
        <DownloadSection trackId={trackId} />
      </>
    ) : null
  }

  const PreviewButton = () => (
    <Button
      variant='tertiary'
      iconLeft={isPlayingPreview ? IconPause : PlayIcon}
      onPress={handlePressPreview}
      fullWidth
    >
      {isPlayingPreview ? messages.pause : messages.preview}
    </Button>
  )

  const renderTags = () => {
    if (!track || (isUnlisted && !track.field_visibility?.tags)) {
      return null
    }

    const filteredTags = (track.tags || '').split(',').filter(Boolean)
    return filteredTags.length > 0 ? (
      <Flex
        direction='row'
        wrap='wrap'
        w='100%'
        justifyContent='flex-start'
        gap='s'
      >
        {filteredTags.map((tag) => (
          <Tag key={tag} onPress={() => handlePressTag(tag)}>
            {tag}
          </Tag>
        ))}
      </Flex>
    ) : null
  }

  if (!trackId) return null

  if (isDeleted) {
    return (
      <DeletedTile
        imageElement={imageElement}
        title={title}
        user={user}
        headerText={headerText}
        handlePressArtistName={handlePressArtistName}
      />
    )
  }

  return (
    <Paper>
      <TrackDogEar trackId={trackId} />
      <Flex p='l' gap='l' alignItems='center' w='100%'>
        <Text
          variant='label'
          size='m'
          strength='default'
          textTransform='uppercase'
          color='subdued'
        >
          {headerText}
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
        {isLongFormContent && track ? (
          <DetailsProgressInfo track={track} />
        ) : null}
        {hasStreamAccess ? (
          <Button
            iconLeft={isPlayingFullAccess ? IconPause : PlayIcon}
            onPress={handlePressPlay}
            fullWidth
          >
            {isPlayingFullAccess ? messages.pause : playText}
          </Button>
        ) : null}
        {shouldShowPreview ? <PreviewButton /> : null}
        <DetailsTileActionButtons
          ddexApp={ddexApp}
          hasReposted={!!hasReposted}
          hasSaved={!!hasSaved}
          hideFavorite={hideFavorite}
          hideOverflow={hideOverflow}
          hideRepost={hideRepost}
          hideShare={hideShare}
          isOwner={isOwner}
          isCollection={false}
          isPublished={!isUnlisted || _is_publishing}
          onPressEdit={handlePressEdit}
          onPressOverflow={handlePressOverflow}
          onPressRepost={handlePressRepost}
          onPressSave={handlePressSave}
          onPressShare={handlePressShare}
          onPressPublish={handlePressPublish}
        />
      </Flex>
      <Flex
        p='l'
        gap='l'
        borderTop='default'
        backgroundColor='surface1'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        {!hasStreamAccess && !isOwner && streamConditions && trackId ? (
          <DetailsTileNoAccess
            trackId={trackId}
            contentType={PurchaseableContentType.TRACK}
            streamConditions={streamConditions}
          />
        ) : null}
        {(hasStreamAccess || isOwner) && streamConditions ? (
          <DetailsTileHasAccess
            streamConditions={streamConditions}
            isOwner={isOwner}
            trackArtist={user}
            contentType={PurchaseableContentType.TRACK}
          />
        ) : null}
        <DetailsTileStats
          playCount={playCount}
          hidePlayCount={shouldHidePlayCount}
          favoriteCount={saveCount}
          hideFavoriteCount={shouldHideFavoriteCount}
          repostCount={repostCount}
          hideRepostCount={shouldHideRepostCount}
          commentCount={commentCount}
          hideCommentCount={shouldHideCommentCount}
          onPressFavorites={handlePressFavorites}
          onPressReposts={handlePressReposts}
          onPressComments={handlePressComments}
        />
        {description ? (
          <Box w='100%'>
            <UserGeneratedText source={'track page'} variant='body' size='s'>
              {description}
            </UserGeneratedText>
          </Box>
        ) : null}
        <TrackMetadataList trackId={trackId} />
        {renderTags()}
        <OfflineStatusRow contentId={trackId} isCollection={false} />
      </Flex>
      {renderBottomContent()}
    </Paper>
  )
}
