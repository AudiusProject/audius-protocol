import { useCallback, useState, useEffect, MouseEvent } from 'react'

import { ID, formatCount, formatSeconds } from '@audius/common'
import { IconCrown, IconHidden, IconTrending } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'
import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import Skeleton from 'components/skeleton/Skeleton'
import { TrackTileProps } from 'components/track/types'
import UserBadges from 'components/user-badges/UserBadges'

import TrackBannerIcon, { TrackBannerIconType } from '../TrackBannerIcon'

import BottomButtons from './BottomButtons'
import styles from './TrackTile.module.css'
import TrackTileArt from './TrackTileArt'

const messages = {
  artistPick: "Artist's Pick",
  coSign: 'Co-Sign',
  reposted: 'Reposted',
  favorited: 'Favorited',
  hiddenTrack: 'Hidden Track',
  repostedAndFavorited: 'Reposted & Favorited'
}

type ExtraProps = {
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
    index,
    showSkeleton,
    hasLoaded,
    toggleSave,
    toggleRepost,
    onShare,
    onClickOverflow,
    coSign,
    darkMode,
    isMatrix,
    userId,
    isTrending,
    showRankIcon
  } = props

  const hideShare: boolean = props.fieldVisibility
    ? props.fieldVisibility.share === false
    : false
  const hidePlays = props.fieldVisibility
    ? props.fieldVisibility.play_count === false
    : false

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

  return (
    <div className={styles.container}>
      {props.showArtistPick && props.isArtistPick && (
        <TrackBannerIcon
          type={TrackBannerIconType.STAR}
          isMobile
          isMatrixMode={isMatrix}
        />
      )}
      {props.isUnlisted && (
        <TrackBannerIcon
          type={TrackBannerIconType.HIDDEN}
          isMobile
          isMatrixMode={isMatrix}
        />
      )}
      <div
        className={styles.mainContent}
        onClick={() => {
          if (showSkeleton) return
          props.togglePlay(props.uid, id)
        }}
      >
        <div className={cn(styles.topRight, styles.statText)}>
          {props.showArtistPick && props.isArtistPick && (
            <div className={styles.topRightIcon}>
              <IconStar />
              {messages.artistPick}
            </div>
          )}
          {props.isUnlisted && (
            <div className={styles.topRightIcon}>
              <IconHidden />
              {messages.hiddenTrack}
            </div>
          )}
          <div className={cn(styles.duration, fadeIn)}>
            {props.duration && formatSeconds(props.duration)}
          </div>
        </div>
        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack={true}
            callback={() => setArtworkLoaded(true)}
            showSkeleton={showSkeleton}
            coverArtSizes={props.coverArtSizes}
            coSign={coSign}
            className={styles.albumArtContainer}
          />
          <div
            className={cn(styles.titles, {
              [styles.titlesActive]: props.isPlaying,
              [styles.titlesSkeleton]: props.showSkeleton
            })}
          >
            <div className={styles.title} onClick={props.goToTrackPage}>
              <div className={cn(fadeIn)}>{props.title}</div>
              {props.isPlaying && <IconVolume />}
              {(!artworkLoaded || showSkeleton) && (
                <Skeleton
                  className={styles.skeleton}
                  width='80%'
                  height='80%'
                />
              )}
            </div>
            <div className={styles.artist} onClick={props.goToArtistPage}>
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
            </div>
          </div>
          {coSign && (
            <div className={styles.coSignLabel}>{messages.coSign}</div>
          )}
        </div>
        {coSign && (
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
        )}
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
                  props.repostCount ? props.makeGoToRepostsPage(id) : undefined
                }
              >
                {formatCount(props.repostCount)}
                <RepostButton
                  iconMode
                  isMatrixMode={isMatrix}
                  isDarkMode={darkMode}
                  className={styles.repostButton}
                />
              </div>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.saveCount,
                  [styles.isHidden]: props.isUnlisted
                })}
                onClick={
                  props.saveCount ? props.makeGoToFavoritesPage(id) : undefined
                }
              >
                {formatCount(props.saveCount)}
                <FavoriteButton
                  iconMode
                  isDarkMode={darkMode}
                  isMatrixMode={isMatrix}
                  className={styles.favoriteButton}
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
        <BottomButtons
          hasSaved={props.hasCurrentUserSaved}
          hasReposted={props.hasCurrentUserReposted}
          toggleRepost={onToggleRepost}
          toggleSave={onToggleSave}
          onShare={onClickShare}
          onClickOverflow={onClickOverflowMenu}
          isOwner={props.isOwner}
          isUnlisted={props.isUnlisted}
          isShareHidden={hideShare}
          isDarkMode={darkMode}
          isMatrixMode={isMatrix}
        />
      </div>
    </div>
  )
}

export default TrackTile
