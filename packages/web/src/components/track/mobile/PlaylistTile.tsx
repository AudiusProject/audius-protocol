import { useState, useEffect, MouseEvent, useCallback } from 'react'

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
  formatLineupTileDuration,
  getDogEarType
} from '@audius/common/utils'
import {
  Box,
  Flex,
  IconVolumeLevel2 as IconVolume,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { range } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import { DogEar } from 'components/dog-ear'
import { TextLink, UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { PlaylistTileProps } from 'components/track/types'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'

import { GatedConditionsPill } from '../GatedConditionsPill'
import { GatedContentLabel } from '../GatedContentLabel'
import { LockedStatusBadge, LockedStatusBadgeProps } from '../LockedStatusBadge'

import BottomButtons from './BottomButtons'
import styles from './PlaylistTile.module.css'
import { RankIcon } from './TrackTile'
import TrackTileArt from './TrackTileArt'
const { setLockedContentId } = gatedContentActions
const { getGatedContentStatusMap } = gatedContentSelectors

type TrackItemProps = {
  index: number
  track?: LineupTrack
  active: boolean
  forceSkeleton?: boolean
}

// Max number of track to display in a playlist
const DISPLAY_TRACK_COUNT = 5

const TrackItem = (props: TrackItemProps) => {
  return (
    <>
      <div className={styles.trackItemDivider}></div>
      <div
        className={cn(styles.trackItem, {
          [styles.activeTrackItem]: props.active
        })}
      >
        {props.forceSkeleton ? (
          <Skeleton width='100%' height='10px' />
        ) : props.track ? (
          <>
            <div className={styles.index}> {props.index + 1} </div>
            <div className={styles.trackTitle}> {props.track.title} </div>
            <div className={styles.byArtist}>
              {' '}
              {`by ${props.track.user.name}`}{' '}
            </div>
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
  numLoadingSkeletonRows?: number
  trackCount?: number
}

const TrackList = ({
  tracks,
  activeTrackUid,
  goToCollectionPage,
  isLoading,
  numLoadingSkeletonRows,
  trackCount
}: TrackListProps) => {
  if (!tracks.length && isLoading && numLoadingSkeletonRows) {
    return (
      <Box backgroundColor='surface1'>
        {range(numLoadingSkeletonRows).map((i) => (
          <TrackItem key={i} active={false} index={i} forceSkeleton />
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
          index={index}
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
  'hasStreamAccess' | 'isOwner' | 'isStreamGated' | 'streamConditions'
> &
  Pick<LockedStatusBadgeProps, 'variant'> & {
    gatedTrackStatus?: GatedContentStatus
    onClickGatedUnlockPill: (e: MouseEvent) => void
  }

const renderLockedContent = ({
  hasStreamAccess,
  isOwner,
  isStreamGated,
  streamConditions,
  gatedTrackStatus,
  onClickGatedUnlockPill,
  variant
}: LockedOrPlaysContentProps) => {
  if (isStreamGated && streamConditions && !isOwner) {
    if (variant === 'premium') {
      return (
        <GatedConditionsPill
          streamConditions={streamConditions}
          unlocking={gatedTrackStatus === 'UNLOCKING'}
          onClick={onClickGatedUnlockPill}
          buttonSize='small'
        />
      )
    }
    return <LockedStatusBadge locked={!hasStreamAccess} variant={variant} />
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
    ownerId,
    isStreamGated,
    hasStreamAccess,
    streamConditions
  } = props
  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !showSkeleton) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, showSkeleton])

  const isReadonly = variant === 'readonly'
  const shouldShow = artworkLoaded && !showSkeleton
  const fadeIn = {
    [styles.show]: shouldShow,
    [styles.hide]: !shouldShow
  }
  const gatedContentStatusMap = useSelector(getGatedContentStatusMap)
  const gatedContentStatus = id ? gatedContentStatusMap[id] : undefined

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
        { source: ModalSource.TrackTile }
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

  const DogEarIconType = getDogEarType({
    streamConditions,
    isOwner,
    hasStreamAccess,
    isArtistPick: false,
    isUnlisted
  })

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

  return (
    <div
      className={cn(
        styles.container,
        { [styles.readonly]: isReadonly },
        containerClassName
      )}
    >
      {DogEarIconType ? (
        <div className={styles.borderOffset}>
          <DogEar type={DogEarIconType} />
        </div>
      ) : null}
      <div
        css={{ overflow: 'hidden' }}
        className={styles.mainContent}
        onClick={props.togglePlay}
      >
        <div className={cn(styles.duration, styles.statText, fadeIn)}>
          {formatLineupTileDuration(props.duration)}
        </div>

        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack={false}
            showSkeleton={props.showSkeleton}
            callback={() => setArtworkLoaded(true)}
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
            <UserLink userId={ownerId} textVariant='body' badgeSize='xs'>
              {!shouldShow ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </UserLink>
          </Flex>
        </div>
        <div className={cn(styles.stats, styles.statText)}>
          <RankIcon
            className={styles.rankIcon}
            index={index}
            isVisible={isTrending && shouldShow}
            showCrown={showRankIcon}
          />
          {isReadonly ? specialContentLabel : null}
          {!!(props.repostCount || props.saveCount) && (
            <>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.saveCount
                })}
                onClick={
                  props.saveCount && !isReadonly
                    ? props.makeGoToFavoritesPage(props.id)
                    : undefined
                }
              >
                {formatCount(props.saveCount)}
                <FavoriteButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.favoriteButton}
                  wrapperClassName={styles.favoriteButtonWrapper}
                />
              </div>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.repostCount
                })}
                onClick={
                  props.repostCount && !isReadonly
                    ? props.makeGoToRepostsPage(props.id)
                    : undefined
                }
              >
                {formatCount(props.repostCount)}
                <RepostButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.repostButton}
                  wrapperClassName={styles.repostButtonWrapper}
                />
              </div>
            </>
          )}
          {isReadonly ? (
            <Text
              variant='body'
              size='xs'
              color='staticWhite'
              className={cn(styles.bottomRight, fadeIn)}
            >
              {renderLockedContent({
                hasStreamAccess,
                isOwner,
                isStreamGated,
                streamConditions,
                gatedTrackStatus: gatedContentStatus,
                variant: isPurchase ? 'premium' : 'gated',
                onClickGatedUnlockPill
              })}
            </Text>
          ) : null}
        </div>
        <TrackList
          activeTrackUid={props.activeTrackUid}
          goToCollectionPage={props.goToCollectionPage}
          tracks={props.tracks}
          isLoading={showSkeleton}
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
              isUnlisted={props.isUnlisted}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PlaylistTile
