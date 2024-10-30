import { useEffect, MouseEvent, useCallback } from 'react'

import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import {
  ID,
  UID,
  LineupTrack,
  AccessConditions,
  ModalSource,
  isContentUSDCPurchaseGated,
  GatedContentStatus
} from '@audius/common/models'
import {
  gatedContentActions,
  gatedContentSelectors,
  PurchaseableContentType,
  usePremiumContentPurchaseModal
} from '@audius/common/store'
import {
  Nullable,
  formatCount,
  formatLineupTileDuration
} from '@audius/common/utils'
import {
  Box,
  Flex,
  IconVisibilityHidden,
  IconVolumeLevel2 as IconVolume,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { range } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import { CollectionDogEar } from 'components/collection'
import { TextLink, UserLink } from 'components/link'
import { LockedStatusPill } from 'components/locked-status-pill'
import Skeleton from 'components/skeleton/Skeleton'
import { PlaylistTileProps } from 'components/track/types'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'

import { GatedConditionsPill } from '../GatedConditionsPill'
import { GatedContentLabel } from '../GatedContentLabel'
import { LineupTileLabel } from '../LineupTileLabel'

import BottomButtons from './BottomButtons'
import styles from './PlaylistTile.module.css'
import { RankIcon } from './TrackTile'
import TrackTileArt from './TrackTileArt'
const { setLockedContentId } = gatedContentActions
const { getGatedContentStatusMap } = gatedContentSelectors

type TrackItemProps = {
  index: number
  track?: LineupTrack
  isAlbum: boolean
  active: boolean
  deleted?: boolean
  forceSkeleton?: boolean
}

// Max number of track to display in a playlist
const DISPLAY_TRACK_COUNT = 5

const messages = {
  by: 'by',
  deleted: '[Deleted by Artist]',
  hidden: 'Hidden'
}

const TrackItem = (props: TrackItemProps) => {
  const { active, deleted, index, isAlbum, track, forceSkeleton } = props
  return (
    <>
      <div className={styles.trackItemDivider}></div>
      <div
        className={cn(styles.trackItem, {
          [styles.deletedTrackItem]: deleted,
          [styles.activeTrackItem]: active
        })}
      >
        {forceSkeleton ? (
          <Skeleton width='100%' height='10px' />
        ) : track ? (
          <>
            <div className={styles.index}> {index + 1} </div>
            <div className={styles.trackTitle}> {track.title} </div>
            {!isAlbum ? (
              <div className={styles.byArtist}>
                {' '}
                {`${messages.by} ${track.user.name}`}{' '}
              </div>
            ) : null}
            {deleted ? (
              <div className={styles.deletedTrack}>{messages.deleted}</div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}

type TrackListProps = {
  activeTrackUid: UID | null
  tracks: LineupTrack[]
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
  isLoading?: boolean
  isAlbum: boolean
  numLoadingSkeletonRows?: number
  trackCount?: number
}

const TrackList = ({
  tracks,
  activeTrackUid,
  goToCollectionPage,
  isLoading,
  isAlbum,
  numLoadingSkeletonRows,
  trackCount
}: TrackListProps) => {
  if (!tracks.length && isLoading && numLoadingSkeletonRows) {
    return (
      <Box backgroundColor='surface1'>
        {range(numLoadingSkeletonRows).map((i) => (
          <TrackItem
            key={i}
            active={false}
            index={i}
            isAlbum={isAlbum}
            forceSkeleton
          />
        ))}
      </Box>
    )
  }

  return (
    <Box backgroundColor='surface1' onClick={goToCollectionPage}>
      {tracks.slice(0, DISPLAY_TRACK_COUNT).map((track, index) => (
        <TrackItem
          key={track.uid}
          active={activeTrackUid === track.uid}
          deleted={track.is_delete}
          index={index}
          isAlbum={isAlbum}
          track={track}
        />
      ))}
      {trackCount && trackCount > DISPLAY_TRACK_COUNT ? (
        <>
          <div className={styles.trackItemDivider}></div>
          <div className={cn(styles.trackItem, styles.trackItemMore)}>
            {`+${trackCount - DISPLAY_TRACK_COUNT} more tracks`}
          </div>
        </>
      ) : null}
    </Box>
  )
}

type ExtraProps = {
  index: number
  isLoading: boolean
  isPlaying: boolean
  isActive: boolean
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  togglePlay: () => void
  makeGoToRepostsPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  isOwner: boolean
  isUnlisted: boolean
  darkMode: boolean
  isMatrix: boolean
  isStreamGated: boolean
  hasStreamAccess: boolean
  streamConditions: Nullable<AccessConditions>
}

type CombinedProps = PlaylistTileProps & ExtraProps

type LockedOrPlaysContentProps = Pick<
  CombinedProps,
  | 'hasStreamAccess'
  | 'isOwner'
  | 'isStreamGated'
  | 'streamConditions'
  | 'variant'
  | 'id'
> & {
  lockedContentType: 'premium' | 'gated'
  gatedTrackStatus?: GatedContentStatus
  onClickGatedUnlockPill: (e: MouseEvent) => void
}

const renderLockedContent = ({
  id,
  hasStreamAccess,
  isOwner,
  isStreamGated,
  streamConditions,
  gatedTrackStatus,
  onClickGatedUnlockPill,
  lockedContentType,
  variant
}: LockedOrPlaysContentProps) => {
  if (isStreamGated && streamConditions && !isOwner) {
    if (
      !hasStreamAccess &&
      lockedContentType === 'premium' &&
      variant === 'readonly'
    ) {
      return (
        <GatedConditionsPill
          streamConditions={streamConditions}
          unlocking={gatedTrackStatus === 'UNLOCKING'}
          onClick={onClickGatedUnlockPill}
          buttonSize='small'
          contentId={id}
          contentType={lockedContentType}
        />
      )
    }
    return (
      <LockedStatusPill locked={!hasStreamAccess} variant={lockedContentType} />
    )
  }
}

const PlaylistTile = (props: PlaylistTileProps & ExtraProps) => {
  const {
    id,
    hasLoaded,
    index,
    showSkeleton,
    numLoadingSkeletonRows,
    isTrending,
    isOwner,
    showRankIcon,
    trackCount,
    variant,
    containerClassName,
    permalink,
    isActive,
    isUnlisted,
    playlistTitle,
    isPlaying,
    isAlbum,
    ownerId,
    isStreamGated,
    hasStreamAccess,
    streamConditions,
    source
  } = props

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById({
    playlistId: id,
    currentUserId
  })

  const {
    is_private: isPrivate,
    repost_count: repostCount,
    save_count: saveCount
  } = collection ?? {}

  useEffect(() => {
    if (!showSkeleton) {
      hasLoaded(index)
    }
  }, [hasLoaded, index, showSkeleton])

  const isReadonly = variant === 'readonly'
  const shouldShow = !showSkeleton
  const fadeIn = {
    [styles.show]: shouldShow,
    [styles.hide]: !shouldShow
  }
  const gatedContentStatusMap = useSelector(getGatedContentStatusMap)
  const gatedContentStatus = id ? gatedContentStatusMap[id] : undefined
  const shouldShowStats = !isPrivate && !!(repostCount || saveCount)

  const [, setModalVisibility] = useModalState('LockedContent')
  const dispatch = useDispatch()
  const openLockedContentModal = useCallback(() => {
    if (id) {
      dispatch(setLockedContentId({ id }))
      setModalVisibility(true)
    }
  }, [dispatch, id, setModalVisibility])

  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)

  const onClickGatedUnlockPill = useAuthenticatedClickCallback(() => {
    if (isPurchase && id) {
      openPremiumContentPurchaseModal(
        { contentId: id, contentType: PurchaseableContentType.ALBUM },
        { source: source ?? ModalSource.TrackTile }
      )
    } else if (id && !hasStreamAccess) {
      openLockedContentModal()
    }
  }, [
    isPurchase,
    id,
    openPremiumContentPurchaseModal,
    hasStreamAccess,
    openLockedContentModal
  ])

  let specialContentLabel = null
  if (isStreamGated) {
    specialContentLabel = (
      <GatedContentLabel
        streamConditions={streamConditions}
        hasStreamAccess={!!hasStreamAccess}
        isOwner={isOwner}
      />
    )
  }
  if (isPrivate) {
    specialContentLabel = (
      <LineupTileLabel icon={IconVisibilityHidden}>
        {messages.hidden}
      </LineupTileLabel>
    )
  }

  return (
    <div
      className={cn(
        styles.container,
        { [styles.readonly]: isReadonly },
        containerClassName
      )}
    >
      <CollectionDogEar collectionId={id} borderOffset={0} />
      <div
        css={{ overflow: 'hidden' }}
        className={styles.mainContent}
        onClick={props.togglePlay}
      >
        <Text
          className={cn(styles.duration, fadeIn)}
          variant='body'
          size='xs'
          strength='default'
          color='subdued'
        >
          {formatLineupTileDuration(
            props.duration,
            false,
            /* isCollection */ true
          )}
        </Text>

        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack={false}
            showSkeleton={props.showSkeleton}
            coverArtSizes={props.coverArtSizes}
            className={styles.albumArtContainer}
            isPlaying={props.isPlaying}
            isBuffering={props.isLoading}
            artworkIconClassName={styles.artworkIcon}
          />
          <Flex
            direction='column'
            justifyContent='center'
            gap='2xs'
            mt='m'
            mr='m'
            flex='0 1 65%'
            css={{ overflow: 'hidden' }}
          >
            <TextLink
              to={permalink ?? ''}
              textVariant='title'
              isActive={isActive}
              applyHoverStylesToInnerSvg
            >
              <Text ellipses className={cn(fadeIn)}>
                {playlistTitle}
              </Text>
              {isPlaying ? <IconVolume size='m' /> : null}
              {!shouldShow ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </TextLink>
            <UserLink userId={ownerId} badgeSize='xs'>
              {!shouldShow ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </UserLink>
          </Flex>
        </div>
        <Text size='xs' color='subdued'>
          <Flex m='m' justifyContent='space-between' alignItems='center'>
            <Flex gap='l'>
              <RankIcon
                className={styles.rankIcon}
                index={index}
                isVisible={isTrending && shouldShow}
                showCrown={showRankIcon}
              />
              {isReadonly ? specialContentLabel : null}
              {shouldShowStats ? (
                <>
                  <Flex
                    gap='xs'
                    alignItems='center'
                    className={cn(styles.statItem, fadeIn, {
                      [styles.disabledStatItem]: !props.saveCount
                    })}
                    onClick={
                      props.saveCount && !isReadonly
                        ? props.makeGoToFavoritesPage(props.id)
                        : undefined
                    }
                  >
                    <FavoriteButton
                      iconMode
                      isDarkMode={props.darkMode}
                      isMatrixMode={props.isMatrix}
                      className={styles.favoriteButton}
                      wrapperClassName={styles.favoriteButtonWrapper}
                    />
                    {formatCount(props.saveCount)}
                  </Flex>
                  <Flex
                    gap='xs'
                    alignItems='center'
                    className={cn(styles.statItem, fadeIn, {
                      [styles.disabledStatItem]: !props.repostCount
                    })}
                    onClick={
                      props.repostCount && !isReadonly
                        ? props.makeGoToRepostsPage(props.id)
                        : undefined
                    }
                  >
                    <RepostButton
                      iconMode
                      isDarkMode={props.darkMode}
                      isMatrixMode={props.isMatrix}
                      className={styles.repostButton}
                      wrapperClassName={styles.repostButtonWrapper}
                    />
                    {formatCount(props.repostCount)}
                  </Flex>
                </>
              ) : null}
            </Flex>
            <Text
              variant='body'
              size='xs'
              color='staticWhite'
              className={cn(styles.bottomRight, fadeIn)}
            >
              {renderLockedContent({
                id,
                hasStreamAccess,
                isOwner,
                isStreamGated,
                streamConditions,
                gatedTrackStatus: gatedContentStatus,
                lockedContentType: isPurchase ? 'premium' : 'gated',
                variant,
                onClickGatedUnlockPill
              })}
            </Text>
          </Flex>
        </Text>
        <TrackList
          activeTrackUid={props.activeTrackUid}
          goToCollectionPage={props.goToCollectionPage}
          tracks={props.tracks}
          isLoading={showSkeleton}
          isAlbum={isAlbum}
          numLoadingSkeletonRows={numLoadingSkeletonRows}
          trackCount={trackCount}
        />
        {!isReadonly ? (
          <div className={cn(fadeIn)}>
            <BottomButtons
              hasSaved={props.hasCurrentUserSaved}
              hasReposted={props.hasCurrentUserReposted}
              toggleSave={props.toggleSave}
              toggleRepost={props.toggleRepost}
              onShare={props.onShare}
              onClickOverflow={props.onClickOverflow}
              onClickGatedUnlockPill={onClickGatedUnlockPill}
              isLoading={props.isLoading}
              isOwner={props.isOwner}
              isDarkMode={props.darkMode}
              isMatrixMode={props.isMatrix}
              hasStreamAccess={props.hasStreamAccess}
              streamConditions={props.streamConditions}
              isUnlisted={isUnlisted}
              contentId={id}
              contentType='playlist'
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PlaylistTile
