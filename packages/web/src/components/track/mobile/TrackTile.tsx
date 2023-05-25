import { useCallback, useState, useEffect, MouseEvent } from 'react'

import {
  ID,
  formatCount,
  PremiumConditions,
  Nullable,
  premiumContentSelectors,
  premiumContentActions,
  FeatureFlags,
  formatLineupTileDuration,
  Genre
} from '@audius/common'
import { IconCrown, IconHidden, IconTrending } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'
import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { useModalState } from 'common/hooks/useModalState'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import Skeleton from 'components/skeleton/Skeleton'
import { PremiumContentLabel } from 'components/track/PremiumContentLabel'
import { TrackTileProps } from 'components/track/types'
import UserBadges from 'components/user-badges/UserBadges'
import { useFlag } from 'hooks/useRemoteConfig'
import { profilePage } from 'utils/route'

import TrackBannerIcon, { TrackBannerIconType } from '../TrackBannerIcon'

import BottomButtons from './BottomButtons'
import styles from './TrackTile.module.css'
import TrackTileArt from './TrackTileArt'

const { setLockedContentId } = premiumContentActions
const { getPremiumTrackStatusMap } = premiumContentSelectors

const messages = {
  artistPick: "Artist's Pick",
  coSign: 'Co-Sign',
  reposted: 'Reposted',
  favorited: 'Favorited',
  hiddenTrack: 'Hidden Track',
  repostedAndFavorited: 'Reposted & Favorited'
}

type ExtraProps = {
  permalink: string
  goToTrackPage: (e: MouseEvent<HTMLElement>) => void
  goToArtistPage: (e: MouseEvent<HTMLElement>) => void
  toggleSave: (trackId: ID) => void
  toggleRepost: (trackId: ID) => void
  onShare: (trackId: ID) => void
  makeGoToRepostsPage: (trackId: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (trackId: ID) => (e: MouseEvent<HTMLElement>) => void
  isOwner: boolean
  darkMode: boolean
  isMatrix: boolean
  isPremium: boolean
  premiumConditions: Nullable<PremiumConditions>
  doesUserHaveAccess: boolean
}

const formatListenCount = (listenCount?: number) => {
  if (!listenCount) return null
  const suffix = listenCount === 1 ? 'Play' : 'Plays'
  return `${formatCount(listenCount)} ${suffix}`
}

const formatCoSign = ({
  hasReposted,
  hasFavorited
}: {
  hasReposted: boolean
  hasFavorited: boolean
}) => {
  if (hasReposted && hasFavorited) {
    return messages.repostedAndFavorited
  } else if (hasFavorited) {
    return messages.favorited
  }
  return messages.reposted
}

export const RankIcon = ({
  showCrown,
  index,
  className,
  isVisible = true
}: {
  showCrown: boolean
  index: number
  isVisible?: boolean
  className?: string
}) => {
  return isVisible ? (
    <div className={cn(styles.rankContainer, className)}>
      {showCrown ? <IconCrown /> : <IconTrending />}
      {index + 1}
    </div>
  ) : null
}

const TrackTile = (props: TrackTileProps & ExtraProps) => {
  const {
    id,
    uid,
    index,
    showSkeleton,
    hasLoaded,
    toggleSave,
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
    isPremium,
    premiumConditions,
    doesUserHaveAccess,
    isTrending,
    showRankIcon,
    permalink,
    artistHandle,
    duration,
    genre,
    isPlaying,
    isBuffering,
    isChat
  } = props
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )

  const hideShare: boolean = props.fieldVisibility
    ? props.fieldVisibility.share === false
    : false
  const hidePlays = props.fieldVisibility
    ? props.fieldVisibility.play_count === false
    : false

  const dispatch = useDispatch()
  const [, setModalVisibility] = useModalState('LockedContent')
  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const trackId = isPremium ? id : null
  const premiumTrackStatus = trackId
    ? premiumTrackStatusMap[trackId]
    : undefined

  const showPremiumCornerTag =
    isGatedContentEnabled &&
    !isLoading &&
    premiumConditions &&
    (isOwner || !doesUserHaveAccess)
  const cornerTagIconType = showPremiumCornerTag
    ? isOwner
      ? premiumConditions.nft_collection
        ? TrackBannerIconType.COLLECTIBLE_GATED
        : TrackBannerIconType.SPECIAL_ACCESS
      : TrackBannerIconType.LOCKED
    : null

  const onToggleSave = useCallback(() => toggleSave(id), [toggleSave, id])

  const onToggleRepost = useCallback(() => toggleRepost(id), [toggleRepost, id])

  const onClickShare = useCallback(() => onShare(id), [onShare, id])

  const onClickOverflowMenu = useCallback(
    () => onClickOverflow && onClickOverflow(id),
    [onClickOverflow, id]
  )

  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !showSkeleton) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, showSkeleton])

  const fadeIn = {
    [styles.show]: artworkLoaded && !showSkeleton,
    [styles.hide]: !artworkLoaded || showSkeleton
  }

  const handleClick = useCallback(() => {
    if (showSkeleton) return

    if (trackId && !doesUserHaveAccess) {
      dispatch(setLockedContentId({ id: trackId }))
      setModalVisibility(true)
      return
    }

    togglePlay(uid, id)
  }, [
    showSkeleton,
    togglePlay,
    uid,
    id,
    trackId,
    doesUserHaveAccess,
    dispatch,
    setModalVisibility
  ])

  return (
    <div className={cn(styles.container, { [styles.chat]: isChat })}>
      {showPremiumCornerTag && cornerTagIconType ? (
        <TrackBannerIcon
          type={cornerTagIconType}
          isMatrixMode={isMatrix}
          containerClassName={styles.premiumCornerTagContainer}
        />
      ) : null}
      {!showPremiumCornerTag && props.showArtistPick && props.isArtistPick ? (
        <TrackBannerIcon
          type={TrackBannerIconType.STAR}
          isMobile
          isMatrixMode={isMatrix}
        />
      ) : null}
      {props.isUnlisted && (
        <TrackBannerIcon
          type={TrackBannerIconType.HIDDEN}
          isMobile
          isMatrixMode={isMatrix}
        />
      )}
      <div className={styles.mainContent} onClick={handleClick}>
        <div className={cn(styles.topRight, styles.statText)}>
          {props.showArtistPick && props.isArtistPick && (
            <div className={styles.topRightIcon}>
              <IconStar />
              {messages.artistPick}
            </div>
          )}
          {!isLoading && isPremium ? (
            <PremiumContentLabel
              premiumConditions={premiumConditions}
              doesUserHaveAccess={!!doesUserHaveAccess}
              isOwner={isOwner}
            />
          ) : null}
          {props.isUnlisted && (
            <div className={styles.topRightIcon}>
              <IconHidden />
              {messages.hiddenTrack}
            </div>
          )}
          <div className={cn(styles.duration, fadeIn)}>
            {duration
              ? formatLineupTileDuration(
                  duration,
                  genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
                )
              : null}
          </div>
        </div>
        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            callback={() => setArtworkLoaded(true)}
            showSkeleton={showSkeleton}
            coverArtSizes={props.coverArtSizes}
            coSign={coSign}
            className={styles.albumArtContainer}
            label={`${props.title} by ${props.artistName}`}
            artworkIconClassName={styles.artworkIcon}
          />
          <div
            className={cn(styles.titles, {
              [styles.titlesActive]: isActive,
              [styles.titlesSkeleton]: props.showSkeleton
            })}
          >
            <a
              className={styles.title}
              href={permalink}
              onClick={props.goToTrackPage}
            >
              <div className={cn(fadeIn)}>{props.title}</div>
              {isPlaying ? <IconVolume /> : null}
              {(!artworkLoaded || showSkeleton) && (
                <Skeleton
                  className={styles.skeleton}
                  width='80%'
                  height='80%'
                />
              )}
            </a>
            <a
              className={styles.artist}
              href={profilePage(artistHandle)}
              onClick={props.goToArtistPage}
            >
              <span className={cn(fadeIn, styles.userName)}>
                {props.artistName}
              </span>
              <UserBadges
                userId={userId}
                badgeSize={12}
                className={styles.iconVerified}
              />
              {(!artworkLoaded || showSkeleton) && (
                <Skeleton
                  className={styles.skeleton}
                  width='60%'
                  height='80%'
                />
              )}
            </a>
          </div>
          {coSign && (
            <div className={styles.coSignLabel}>{messages.coSign}</div>
          )}
        </div>
        {coSign && !isChat ? (
          <div className={styles.coSignText}>
            <div className={styles.name}>
              {coSign.user.name}
              <UserBadges
                userId={coSign.user.user_id}
                className={styles.iconVerified}
                badgeSize={8}
              />
            </div>
            {formatCoSign({
              hasReposted: coSign.has_remix_author_reposted,
              hasFavorited: coSign.has_remix_author_saved
            })}
          </div>
        ) : null}
        <div className={cn(styles.stats, styles.statText)}>
          <RankIcon
            showCrown={showRankIcon}
            index={index}
            isVisible={isTrending && artworkLoaded && !showSkeleton}
            className={styles.rankIconContainer}
          />
          {!!(props.repostCount || props.saveCount) && (
            <>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.repostCount,
                  [styles.isHidden]: props.isUnlisted
                })}
                onClick={
                  props.repostCount && !isChat
                    ? props.makeGoToRepostsPage(id)
                    : undefined
                }
              >
                {formatCount(props.repostCount)}
                <RepostButton
                  iconMode
                  isMatrixMode={isMatrix}
                  isDarkMode={darkMode}
                  className={styles.repostButton}
                  wrapperClassName={styles.repostButtonWrapper}
                />
              </div>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.saveCount,
                  [styles.isHidden]: props.isUnlisted
                })}
                onClick={
                  props.saveCount && !isChat
                    ? props.makeGoToFavoritesPage(id)
                    : undefined
                }
              >
                {formatCount(props.saveCount)}
                <FavoriteButton
                  iconMode
                  isDarkMode={darkMode}
                  isMatrixMode={isMatrix}
                  className={styles.favoriteButton}
                  wrapperClassName={styles.favoriteButtonWrapper}
                />
              </div>
            </>
          )}
          <div
            className={cn(styles.listenCount, fadeIn, {
              [styles.isHidden]: hidePlays
            })}
          >
            {formatListenCount(props.listenCount)}
          </div>
        </div>
        {!isChat ? (
          <BottomButtons
            hasSaved={props.hasCurrentUserSaved}
            hasReposted={props.hasCurrentUserReposted}
            toggleRepost={onToggleRepost}
            toggleSave={onToggleSave}
            onShare={onClickShare}
            onClickOverflow={onClickOverflowMenu}
            isOwner={isOwner}
            isUnlisted={isUnlisted}
            doesUserHaveAccess={doesUserHaveAccess}
            premiumTrackStatus={premiumTrackStatus}
            isShareHidden={hideShare}
            isDarkMode={darkMode}
            isMatrixMode={isMatrix}
            isTrack
          />
        ) : null}
      </div>
    </div>
  )
}

export default TrackTile
