import React, { memo, MouseEvent, useCallback } from 'react'

import { IconCrown } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'
import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { formatCount, pluralize } from 'common/utils/formatUtil'
import { formatSeconds } from 'common/utils/timeUtil'
import Skeleton from 'components/general/Skeleton'
import FavoriteButton from 'components/general/alt-button/FavoriteButton'
import RepostButton from 'components/general/alt-button/RepostButton'
import ShareButton from 'components/general/alt-button/ShareButton'
import Toast from 'components/toast/Toast'
import Tooltip from 'components/tooltip/Tooltip'
import { ComponentPlacement, MountPlacement } from 'components/types'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'

import ArtistPick from '../ArtistPick'
import {
  TrackTileSize,
  DesktopTrackTileProps as TrackTileProps
} from '../types'

import styles from './TrackTile.module.css'

const messages = {
  getPlays: (listenCount: number) => ` ${pluralize('Play', listenCount)}`,
  artistPick: 'Artist Pick'
}

const RankAndIndexIndicator = ({
  hasOrdering,
  showCrownIcon,
  isLoading,
  index
}: {
  hasOrdering: boolean
  showCrownIcon: boolean
  isLoading: boolean
  index: number
}) => {
  return (
    <>
      {hasOrdering && (
        <div className={styles.order}>
          {showCrownIcon && (
            <div className={styles.crownContainer}>
              <IconCrown />
            </div>
          )}
          {!isLoading && index}
        </div>
      )}
    </>
  )
}

const TrackTile = memo(
  ({
    size,
    order,
    standalone,
    isFavorited,
    isReposted,
    isOwner,
    listenCount,
    isActive,
    isDisabled,
    isLoading,
    isArtistPick,
    artwork,
    rightActions,
    header,
    title,
    userName,
    duration,
    stats,
    bottomBar,
    isDarkMode,
    isMatrixMode,
    showIconButtons = true,
    containerClassName,
    onClickTitle,
    onClickRepost,
    onClickFavorite,
    onClickShare,
    onTogglePlay,
    showRankIcon
  }: TrackTileProps) => {
    const hasOrdering = order !== undefined
    const onStopPropagation = useCallback(
      (e: MouseEvent) => e.stopPropagation(),
      []
    )

    return (
      <div
        className={cn(styles.container, {
          [containerClassName!]: !!containerClassName,
          // Active indicates that the track is the current queue item
          [styles.isActive]: isActive,
          [styles.isDisabled]: isDisabled,

          [styles.large]: size === TrackTileSize.LARGE,
          [styles.small]: size === TrackTileSize.SMALL,

          // Standalone means that this tile is not w/ a playlist
          [styles.standalone]: !!standalone
        })}
        onClick={isLoading || isDisabled ? undefined : onTogglePlay}
      >
        {/* prefix ordering */}
        <RankAndIndexIndicator
          hasOrdering={hasOrdering}
          showCrownIcon={showRankIcon}
          isLoading={!!isLoading}
          index={order ?? 0}
        />
        {/* Track tile image */}
        <div
          className={cn(styles.imageContainer, {
            [styles.leftSpacing]: !hasOrdering
          })}
        >
          {artwork}
        </div>
        {isArtistPick && <ArtistPick isMatrixMode={isMatrixMode} />}
        <div
          className={cn(styles.body, {
            // if track and not playlist/album
            [styles.withoutHeader]: true
          })}
        >
          <div className={cn(styles.topSection)}>
            <div className={cn(styles.headerRow)}>
              {!isLoading && header && <div>{header}</div>}
            </div>
            <div className={styles.titleRow}>
              {isLoading ? (
                <Skeleton width='80%' className={styles.skeleton} />
              ) : (
                <span className={styles.title} onClick={onClickTitle}>
                  {title}
                  {isActive ? (
                    <IconVolume className={styles.volumeIcon} />
                  ) : null}
                </span>
              )}
            </div>
            <div className={styles.creatorRow}>
              {isLoading ? (
                <Skeleton width='50%' className={styles.skeleton} />
              ) : (
                userName
              )}
            </div>
            <div className={styles.socialsRow}>
              {isLoading ? (
                <Skeleton width='30%' className={styles.skeleton} />
              ) : (
                stats
              )}
            </div>
            <div className={styles.topRight}>
              {isArtistPick && (
                <div className={styles.artistPickLabel}>
                  <IconStar className={styles.iconStar} />
                  {messages.artistPick}
                </div>
              )}
              {!isLoading && duration && (
                <div className={styles.duration}>{formatSeconds(duration)}</div>
              )}
            </div>
            <div className={styles.bottomRight}>
              {!isLoading && listenCount !== undefined && listenCount > 0 && (
                <div className={styles.plays}>
                  {formatCount(listenCount)}
                  {messages.getPlays(listenCount)}
                </div>
              )}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.bottomRow}>
            {bottomBar}
            {!isLoading && showIconButtons && (
              <div className={styles.iconButtons}>
                <Tooltip
                  text={isReposted ? 'Unrepost' : 'Repost'}
                  disabled={isDisabled || isOwner}
                  placement={'bottom'}
                >
                  <div
                    className={cn(styles.iconButtonContainer, {
                      [styles.isDisabled]: isOwner
                    })}
                  >
                    <RepostButton
                      onClick={onClickRepost}
                      isActive={isReposted}
                      isDisabled={isOwner}
                      isDarkMode={!!isDarkMode}
                      isMatrixMode={isMatrixMode}
                      wrapperClassName={styles.iconButton}
                    />
                  </div>
                </Tooltip>
                <Tooltip
                  text={isFavorited ? 'Unfavorite' : 'Favorite'}
                  disabled={isDisabled || isOwner}
                  placement={'bottom'}
                >
                  <div
                    className={cn(styles.iconButtonContainer, {
                      [styles.isDisabled]: isOwner
                    })}
                  >
                    <FavoriteButton
                      onClick={onClickFavorite}
                      isActive={isFavorited}
                      isDisabled={isOwner}
                      isDarkMode={!!isDarkMode}
                      isMatrixMode={isMatrixMode}
                      wrapperClassName={styles.iconButton}
                    />
                  </div>
                </Tooltip>
                <Tooltip
                  text={'Share'}
                  disabled={isDisabled}
                  placement={'bottom'}
                >
                  <div
                    className={styles.iconButtonContainer}
                    onClick={onStopPropagation}
                  >
                    <Toast
                      text={'Copied To Clipboard!'}
                      disabled={isDisabled}
                      requireAccount={false}
                      delay={SHARE_TOAST_TIMEOUT_MILLIS}
                      fillParent={false}
                      placement={ComponentPlacement.RIGHT}
                      mount={MountPlacement.PAGE}
                    >
                      <div className={styles.iconShareContainer}>
                        <ShareButton
                          onClick={onClickShare}
                          isDarkMode={!!isDarkMode}
                          className={styles.iconButton}
                          stopPropagation={false}
                          isMatrixMode={isMatrixMode}
                        />
                      </div>
                    </Toast>
                  </div>
                </Tooltip>
              </div>
            )}
            {!isLoading && (
              <div onClick={onStopPropagation}>{rightActions}</div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

export default memo(TrackTile)
