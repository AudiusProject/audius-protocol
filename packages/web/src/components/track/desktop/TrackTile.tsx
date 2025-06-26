import { useCallback, useEffect, MouseEvent, useRef } from 'react'

import { useCurrentUserId, useTrack, useUser } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  ID,
  UID
} from '@audius/common/models'
import {
  playbackPositionSelectors,
  CommonState,
  tracksSocialActions,
  shareModalUIActions,
  gatedContentActions,
  playerSelectors
} from '@audius/common/store'
import {
  formatLineupTileDuration,
  isLongFormContent,
  Genre
} from '@audius/common/utils'
import {
  IconVolumeLevel2 as IconVolume,
  IconCheck,
  IconCrown,
  Text,
  Flex,
  ProgressBar,
  Divider,
  IconKebabHorizontal,
  Paper,
  Box,
  IconButton
} from '@audius/harmony'
import { useSelector, useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Draggable } from 'components/dragndrop'
import { TextLink, UserLink } from 'components/link'
import Menu from 'components/menu/Menu'
import Skeleton from 'components/skeleton/Skeleton'
import { TrackArtwork } from 'components/track/Artwork'
import { DragDropKind } from 'store/dragndrop/slice'
import { isDescendantElementOf } from 'utils/domUtils'
import { fullTrackPage } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { OwnerActionButtons } from '../OwnerActionButtons'
import { TrackDogEar } from '../TrackDogEar'
import { TrackTileStats } from '../TrackTileStats'
import { ViewerActionButtons } from '../ViewerActionButtons'
import { getTrackWithFallback, getUserWithFallback } from '../helpers'
import { messages } from '../trackTileMessages'
import { TrackTileSize } from '../types'

import styles from './TrackTile.module.css'

const { getTrackPosition } = playbackPositionSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { repostTrack, undoRepostTrack, saveTrack, unsaveTrack } =
  tracksSocialActions
const { setLockedContentId } = gatedContentActions
const { getUid, getBuffering, getPlaying } = playerSelectors

// Props from ConnectedTrackTile
export type TrackTileProps = {
  uid: UID
  id: ID
  index: number
  order?: number
  containerClassName?: string
  size: TrackTileSize
  statSize: 'small' | 'large'
  ordered: boolean
  togglePlay: (uid: UID, id: ID) => void
  isLoading: boolean
  hasLoaded: (index: number) => void
  isTrending: boolean
  isFeed: boolean
  onClick?: (trackId: ID) => void
  dragKind?: DragDropKind
}

export const TrackTile = ({
  uid,
  id,
  index,
  order,
  containerClassName,
  size,
  statSize,
  ordered,
  togglePlay,
  isLoading,
  hasLoaded,
  isTrending,
  isFeed = false,
  onClick,
  dragKind
}: TrackTileProps) => {
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()
  const { data: track, isPending } = useTrack(id)
  const { data: partialUser } = useUser(track?.owner_id, {
    select: (user) => ({
      user_id: user?.user_id,
      handle: user?.handle,
      name: user?.name,
      is_verified: user?.is_verified,
      is_deactivated: user?.is_deactivated,
      artist_pick_track_id: user?.artist_pick_track_id
    })
  })
  const { user_id, is_deactivated: isOwnerDeactivated } =
    getUserWithFallback(partialUser)
  const playingUid = useSelector(getUid)
  const isPlaying = useSelector(getPlaying)
  const isBuffering = useSelector(getBuffering)
  const isActive = uid === playingUid
  const isTrackBuffering = isActive && isBuffering
  const isTrackPlaying = isActive && isPlaying
  const isOwner = currentUserId === user_id
  const hasPreview = !!track?.preview_cid

  const trackPositionInfo = useSelector((state: CommonState) =>
    getTrackPosition(state, { trackId: id, userId: currentUserId })
  )

  const trackWithFallback = getTrackWithFallback(track)
  const {
    is_delete,
    is_stream_gated: isStreamGated,
    track_id: trackId,
    title,
    genre,
    permalink,
    _co_sign: coSign,
    has_current_user_reposted: isReposted,
    has_current_user_saved: isFavorited,
    duration
  } = trackWithFallback

  const { isFetchingNFTAccess, hasStreamAccess } =
    useGatedContentAccess(trackWithFallback)
  const loading = isLoading || isFetchingNFTAccess || isPending

  const [, setLockedContentVisibility] = useModalState('LockedContent')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && hasLoaded) {
      hasLoaded?.(index)
    }
  }, [hasLoaded, index, loading])

  const shareTrack = useCallback(
    (trackId: ID) => {
      dispatch(
        requestOpenShareModal({
          type: 'track',
          trackId,
          source: ShareSource.TILE
        })
      )
    },
    [dispatch]
  )
  const handleSaveTrack = useCallback(
    (trackId: ID, isFeed: boolean) => {
      dispatch(saveTrack(trackId, FavoriteSource.TILE, isFeed))
    },
    [dispatch]
  )

  const handleUndoSaveTrack = useCallback(
    (trackId: ID) => {
      dispatch(unsaveTrack(trackId, FavoriteSource.TILE))
    },
    [dispatch]
  )

  const handleRepostTrack = useCallback(
    (trackId: ID, isFeed: boolean) => {
      dispatch(repostTrack(trackId, RepostSource.TILE, isFeed))
    },
    [dispatch]
  )

  const handleUndoRepostTrack = useCallback(
    (trackId: ID) => {
      dispatch(undoRepostTrack(trackId, RepostSource.TILE))
    },
    [dispatch]
  )

  const userName = (
    <UserLink userId={user_id} badgeSize='xs' isActive={isActive} popover />
  )

  const onClickFavorite = useCallback(() => {
    if (isFavorited) {
      handleUndoSaveTrack(trackId)
    } else {
      handleSaveTrack(trackId, isFeed)
    }
  }, [isFavorited, handleUndoSaveTrack, trackId, handleSaveTrack, isFeed])

  const onClickRepost = useCallback(() => {
    if (isReposted) {
      handleUndoRepostTrack(trackId)
    } else {
      handleRepostTrack(trackId, isFeed)
    }
  }, [handleRepostTrack, handleUndoRepostTrack, trackId, isReposted, isFeed])

  const onClickShare = useCallback(() => {
    shareTrack(trackId)
  }, [shareTrack, trackId])

  const onClickTitle = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      onClick?.(trackId)
    },
    [onClick, trackId]
  )

  const openLockedContentModal = useCallback(() => {
    dispatch(setLockedContentId({ id: trackId }))
    setLockedContentVisibility(true)
  }, [dispatch, trackId, setLockedContentVisibility])

  const onTogglePlay = useCallback(
    (e?: MouseEvent /* click event within TrackTile */) => {
      const shouldSkipTogglePlay = isDescendantElementOf(
        e?.target,
        menuRef.current
      )
      if (shouldSkipTogglePlay) return
      if (trackId && !hasStreamAccess && !hasPreview) {
        openLockedContentModal()
        return
      }
      togglePlay(uid, trackId)
    },
    [
      togglePlay,
      hasPreview,
      uid,
      trackId,
      hasStreamAccess,
      openLockedContentModal
    ]
  )

  const renderOverflowMenu = () => {
    const menu: Omit<import('components/menu/TrackMenu').OwnProps, 'children'> =
      {
        extraMenuItems: [],
        handle: partialUser?.handle || '',
        includeAddToPlaylist: !trackWithFallback.is_unlisted || isOwner,
        includeAddToAlbum: isOwner && !!trackWithFallback.ddex_app,
        includeArtistPick: isOwner,
        includeEdit: isOwner,
        ddexApp: track?.ddex_app,
        includeEmbed: !(trackWithFallback.is_unlisted || isStreamGated),
        includeFavorite: hasStreamAccess,
        includeRepost: hasStreamAccess,
        includeShare: true,
        includeTrackPage: true,
        isDeleted: is_delete || isOwnerDeactivated,
        isFavorited,
        isOwner,
        isReposted,
        isUnlisted: trackWithFallback.is_unlisted,
        trackId,
        trackTitle: title,
        genre: genre as Genre,
        trackPermalink: permalink,
        type: 'track'
      }
    return (
      <Menu menu={menu}>
        {(ref, triggerPopup) => (
          <IconButton
            size={size === TrackTileSize.LARGE ? 'l' : 'm'}
            aria-label='More options'
            onClick={(e) => {
              e.stopPropagation()
              triggerPopup()
            }}
            icon={IconKebabHorizontal}
            color='subdued'
            ref={ref}
          />
        )}
      </Menu>
    )
  }

  if (is_delete || isOwnerDeactivated) return null

  const tileOrder =
    order ?? (ordered && index !== undefined ? index + 1 : undefined)
  const disableActions = false
  const showSkeleton = loading

  const tileContent = (
    <Paper
      css={[
        isLoading && { opacity: 0.6 },
        disableActions && { opacity: 0.5, pointerEvents: 'none' },
        {
          height: size === TrackTileSize.LARGE ? 144 : 128,
          '&:hover .artworkIcon': { opacity: 0.75 }
        }
      ]}
      className={containerClassName}
      mb={size === TrackTileSize.LARGE ? 'l' : 's'}
      p='s'
      gap='l'
      onClick={!isLoading && !disableActions ? onTogglePlay : undefined}
    >
      <Flex gap='s'>
        {/* prefix ordering */}
        {tileOrder && (
          <Flex column gap='2xs' alignItems='center' justifyContent='center'>
            {!isLoading && tileOrder <= 5 && (
              <IconCrown color='default' size='s' />
            )}
            <Text variant='label' color='default'>
              {!isLoading && tileOrder}
            </Text>
          </Flex>
        )}
        {/* Track tile image */}
        <Box
          h={size === TrackTileSize.LARGE ? 128 : 108}
          w={size === TrackTileSize.LARGE ? 128 : 108}
        >
          <TrackArtwork
            id={trackId}
            coSign={coSign || undefined}
            size='large'
            isBuffering={isTrackBuffering}
            isPlaying={isTrackPlaying}
            artworkIconClassName='artworkIcon'
            showArtworkIcon={!loading}
            showSkeleton={loading}
            hasStreamAccess={hasStreamAccess || hasPreview}
          />
        </Box>
      </Flex>
      <TrackDogEar trackId={trackId} hideUnlocked />
      <Flex column flex={1}>
        <Flex direction='column' justifyContent='space-between' h='100%'>
          <Flex column gap='s'>
            <Flex direction='column' gap='xs' pv='xs'>
              {isLoading ? (
                <Skeleton width='80%' height='20px' />
              ) : (
                <Flex mr='3xl'>
                  <TextLink
                    css={{ alignItems: 'center' }}
                    to={permalink}
                    isActive={isActive}
                    textVariant='title'
                    applyHoverStylesToInnerSvg
                    onClick={onClickTitle}
                    disabled={disableActions}
                    ellipses
                  >
                    <Text ellipses>{title}</Text>
                    {isTrackPlaying ? <IconVolume size='m' /> : null}
                  </TextLink>
                </Flex>
              )}
              {isLoading ? <Skeleton width='50%' height='20px' /> : userName}
            </Flex>
          </Flex>
          <TrackTileStats
            trackId={trackId}
            rankIndex={tileOrder}
            size={size}
            isLoading={isLoading}
          />
          <Text variant='body' size='xs' className={styles.topRight}>
            {!isLoading && duration ? (
              <div className={styles.duration}>
                {isLongFormContent({ genre }) && trackPositionInfo ? (
                  trackPositionInfo.status === 'IN_PROGRESS' ? (
                    <div className={styles.progressTextContainer}>
                      <p className={styles.progressText}>
                        {`${formatLineupTileDuration(
                          duration - trackPositionInfo.playbackPosition,
                          true,
                          true
                        )} ${messages.timeLeft}`}
                      </p>
                      <ProgressBar
                        value={
                          (trackPositionInfo.playbackPosition / duration) * 100
                        }
                        sliderClassName={styles.progressTextSlider}
                      />
                    </div>
                  ) : trackPositionInfo.status === 'COMPLETED' ? (
                    <div className={styles.completeText}>
                      {messages.played}
                      <IconCheck className={styles.completeIcon} />
                    </div>
                  ) : (
                    formatLineupTileDuration(duration, true, true)
                  )
                ) : (
                  formatLineupTileDuration(
                    duration,
                    isLongFormContent({ genre }),
                    true
                  )
                )}
              </div>
            ) : null}
          </Text>
        </Flex>
        {isOwner ? (
          <Flex column gap='s'>
            <Divider orientation='horizontal' />
            <OwnerActionButtons
              contentId={trackId}
              contentType='track'
              isDisabled={disableActions}
              isLoading={isLoading}
              rightActions={renderOverflowMenu()}
              isDarkMode={isDarkMode()}
              isMatrixMode={isMatrix()}
              showIconButtons={true}
              onClickShare={onClickShare}
            />
          </Flex>
        ) : (
          <Flex column gap='s'>
            <Divider orientation='horizontal' />
            <ViewerActionButtons
              contentId={trackId}
              contentType='track'
              hasStreamAccess={hasStreamAccess}
              isDisabled={disableActions}
              isLoading={isLoading}
              rightActions={renderOverflowMenu()}
              isDarkMode={isDarkMode()}
              isMatrixMode={isMatrix()}
              showIconButtons={true}
              onClickRepost={onClickRepost}
              onClickFavorite={onClickFavorite}
              onClickShare={onClickShare}
              onClickGatedUnlockPill={openLockedContentModal}
            />
          </Flex>
        )}
      </Flex>
    </Paper>
  )

  if (isStreamGated) {
    return tileContent
  }

  return (
    <Draggable
      text={title}
      kind={dragKind ?? 'track'}
      id={trackId}
      isOwner={isOwner}
      isDisabled={disableActions || showSkeleton}
      link={fullTrackPage(permalink)}
    >
      {tileContent}
    </Draggable>
  )
}
