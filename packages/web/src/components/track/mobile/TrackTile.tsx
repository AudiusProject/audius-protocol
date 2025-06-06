import { useCallback, useEffect, ReactNode } from 'react'

import { useToggleFavoriteTrack } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import {
  ModalSource,
  isContentUSDCPurchaseGated,
  ID,
  AccessConditions,
  FavoriteSource
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  usePremiumContentPurchaseModal,
  gatedContentActions,
  gatedContentSelectors,
  PurchaseableContentType
} from '@audius/common/store'
import { Genre, formatLineupTileDuration, Nullable } from '@audius/common/utils'
import { IconVolumeLevel2 as IconVolume, Text, Flex } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { TextLink, UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { TrackTileProps, TrackTileSize } from 'components/track/types'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'

import { TrackDogEar } from '../TrackDogEar'
import { TrackTileStats } from '../TrackTileStats'
import { messages } from '../trackTileMessages'

import BottomButtons from './BottomButtons'
import styles from './TrackTile.module.css'
import TrackTileArt from './TrackTileArt'

const { setLockedContentId } = gatedContentActions
const { getGatedContentStatusMap } = gatedContentSelectors

type ExtraProps = {
  permalink: string
  toggleRepost: (trackId: ID) => void
  onShare: (trackId: ID) => void
  isOwner: boolean
  darkMode: boolean
  isMatrix: boolean
  isStreamGated: boolean
  streamConditions?: Nullable<AccessConditions>
  hasPreview?: boolean
  hasStreamAccess: boolean
  trackId?: number
  renderOverflow?: () => ReactNode
}

type CombinedProps = TrackTileProps & ExtraProps

const TrackTile = (props: CombinedProps) => {
  const {
    id,
    uid,
    index,
    showSkeleton,
    hasLoaded,
    toggleRepost,
    onShare,
    onClickOverflow,
    togglePlay,
    coSign,
    darkMode,
    isActive,
    isMatrix,
    userId,
    isOwner,
    isUnlisted,
    isLoading,
    isStreamGated,
    streamConditions,
    hasStreamAccess,
    permalink,
    duration,
    genre,
    isPlaying,
    isBuffering,
    variant,
    containerClassName,
    hasPreview = false,
    title,
    source,
    renderOverflow,
    isTrending
  } = props

  const toggleSaveTrack = useToggleFavoriteTrack({
    trackId: id as number,
    source: FavoriteSource.TILE
  })

  const dispatch = useDispatch()
  const [, setModalVisibility] = useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const gatedTrackStatusMap = useSelector(getGatedContentStatusMap)
  const trackId = isStreamGated ? id : null
  const gatedTrackStatus = trackId ? gatedTrackStatusMap[trackId] : undefined
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)

  const onToggleRepost = useCallback(() => toggleRepost(id), [toggleRepost, id])

  const onClickShare = useCallback(() => onShare(id), [onShare, id])

  const onClickOverflowMenu = useCallback(
    () => onClickOverflow && onClickOverflow(id),
    [onClickOverflow, id]
  )

  const openLockedContentModal = useCallback(() => {
    if (trackId) {
      dispatch(setLockedContentId({ id: trackId }))
      setModalVisibility(true)
    }
  }, [trackId, dispatch, setModalVisibility])

  const onClickPillRequiresAccount = useRequiresAccountOnClick(() => {
    if (isPurchase && trackId) {
      openPremiumContentPurchaseModal(
        { contentId: trackId, contentType: PurchaseableContentType.TRACK },
        { source: source ?? ModalSource.TrackTile }
      )
    } else if (trackId && !hasStreamAccess) {
      openLockedContentModal()
    }
  }, [
    isPurchase,
    trackId,
    openPremiumContentPurchaseModal,
    hasStreamAccess,
    openLockedContentModal
  ])

  const onClickPill = useCallback(() => {
    if (isPurchase && trackId) {
      openPremiumContentPurchaseModal(
        { contentId: trackId, contentType: PurchaseableContentType.TRACK },
        { source: source ?? ModalSource.TrackTile }
      )
    } else if (trackId && !hasStreamAccess) {
      openLockedContentModal()
    }
  }, [
    isPurchase,
    trackId,
    hasStreamAccess,
    openPremiumContentPurchaseModal,
    source,
    openLockedContentModal
  ])

  const { isEnabled: isGuestCheckoutEnabled } = useFeatureFlag(
    FeatureFlags.GUEST_CHECKOUT
  )

  useEffect(() => {
    if (!showSkeleton) {
      hasLoaded?.(index)
    }
  }, [hasLoaded, index, showSkeleton])

  const fadeIn = {
    [styles.show]: !showSkeleton,
    [styles.hide]: showSkeleton
  }

  const handleClick = useCallback(() => {
    if (showSkeleton) return

    if (trackId && !hasStreamAccess && !hasPreview) {
      openLockedContentModal()
      return
    }

    togglePlay(uid, id)
  }, [
    showSkeleton,
    togglePlay,
    uid,
    id,
    trackId,
    hasStreamAccess,
    hasPreview,
    openLockedContentModal
  ])

  const isReadonly = variant === 'readonly'

  return (
    <div
      className={cn(
        styles.container,
        { [styles.readonly]: isReadonly },
        containerClassName
      )}
      css={{ width: '100%' }}
    >
      <TrackDogEar trackId={id} hideUnlocked />
      <div className={styles.mainContent} onClick={handleClick}>
        <Text
          variant='body'
          size='xs'
          className={cn(styles.topRight, styles.statText)}
        >
          <div className={cn(styles.duration, fadeIn)}>
            {duration
              ? formatLineupTileDuration(
                  duration,
                  genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
                )
              : null}
          </div>
        </Text>
        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            showSkeleton={showSkeleton}
            coSign={coSign}
            className={styles.albumArtContainer}
            label={`${title} by ${props.artistName}`}
            artworkIconClassName={styles.artworkIcon}
          />
          <Flex
            direction='column'
            gap='xs'
            pv='xs'
            mr='m'
            flex='0 1 65%'
            css={{ overflow: 'hidden' }}
          >
            <TextLink
              to={permalink}
              textVariant='title'
              isActive={isActive}
              applyHoverStylesToInnerSvg
            >
              <Text ellipses>{title || messages.loading}</Text>
              {isPlaying ? <IconVolume size='m' /> : null}
              {showSkeleton ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </TextLink>
            <UserLink userId={userId} badgeSize='xs'>
              {showSkeleton ? (
                <>
                  <Text>{messages.loading}</Text>
                  <Skeleton className={styles.skeleton} height='20px' />
                </>
              ) : null}
            </UserLink>
          </Flex>
        </div>
        <TrackTileStats
          trackId={id}
          isTrending={isTrending}
          rankIndex={index}
          size={TrackTileSize.SMALL}
          isLoading={isLoading}
        />
        {isReadonly ? null : (
          <BottomButtons
            hasSaved={props.hasCurrentUserSaved}
            hasReposted={props.hasCurrentUserReposted}
            toggleRepost={onToggleRepost}
            toggleSave={toggleSaveTrack}
            onShare={onClickShare}
            onClickOverflow={onClickOverflowMenu}
            renderOverflow={renderOverflow}
            onClickGatedUnlockPill={
              isGuestCheckoutEnabled ? onClickPill : onClickPillRequiresAccount
            }
            isOwner={isOwner}
            readonly={isReadonly}
            isLoading={isLoading}
            isUnlisted={isUnlisted}
            hasStreamAccess={hasStreamAccess}
            streamConditions={streamConditions}
            gatedTrackStatus={gatedTrackStatus}
            isDarkMode={darkMode}
            isMatrixMode={isMatrix}
            isTrack
            contentId={id}
            contentType='track'
          />
        )}
      </div>
    </div>
  )
}

export default TrackTile
