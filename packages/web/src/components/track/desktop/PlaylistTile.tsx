import { memo, ReactNode, useCallback } from 'react'

import { Scrollbar, IconArrowRight as IconArrow } from '@audius/harmony'
import cn from 'classnames'

import {
  TrackTileSize,
  DesktopPlaylistTileProps as PlaylistTileProps
} from 'components/track/types'

import styles from './PlaylistTile.module.css'
import TrackTile from './TrackTile'

const DefaultTileContainer = ({ children }: { children: ReactNode }) => (
  <>{children}</>
)

const PlaylistTile = ({
  size,
  order,
  isFavorited,
  isReposted,
  isOwner,
  isLoading,
  isActive,
  isDisabled,
  isDarkMode,
  isMatrixMode,
  isPlaying,
  artwork,
  rightActions,
  header,
  title,
  userName,
  duration,
  stats,
  bottomBar,
  showIconButtons,
  containerClassName,
  tileClassName,
  tracksContainerClassName,
  onClickTitle,
  onClickRepost,
  onClickFavorite,
  onClickShare,
  onTogglePlay,
  trackList,
  trackCount,
  isTrending,
  showRankIcon,
  href,
  TileTrackContainer = DefaultTileContainer
}: PlaylistTileProps) => {
  const renderTracks = useCallback(
    () => (
      <Scrollbar
        className={cn(styles.playlistTracks, {
          [tracksContainerClassName!]: !!tracksContainerClassName
        })}
      >
        {trackList}
      </Scrollbar>
    ),
    [tracksContainerClassName, trackList]
  )

  const renderMoreTracks = useCallback(() => {
    const hasMoreTracks = trackCount ? trackCount > trackList.length : false
    return (
      !isLoading &&
      hasMoreTracks && (
        <div onClick={onClickTitle} className={styles.moreTracks}>
          {`${trackCount - trackList.length} More Tracks`}
          <IconArrow className={styles.moreArrow} />
        </div>
      )
    )
  }, [trackCount, trackList, onClickTitle, isLoading])

  return (
    <div
      className={cn(styles.container, {
        [containerClassName!]: !!containerClassName,
        [styles.small]: size === TrackTileSize.SMALL,
        [styles.large]: size === TrackTileSize.LARGE,
        [styles.disabled]: !!isDisabled
      })}
    >
      <TileTrackContainer>
        <TrackTile
          size={size}
          order={order}
          isFavorited={isFavorited}
          isReposted={isReposted}
          isOwner={isOwner}
          isLoading={isLoading}
          isActive={isActive}
          isPlaying={isPlaying}
          isDisabled={isDisabled}
          isDarkMode={isDarkMode}
          isMatrixMode={isMatrixMode}
          artwork={artwork}
          rightActions={rightActions}
          header={header}
          title={title}
          userName={userName}
          duration={duration}
          stats={stats}
          bottomBar={bottomBar}
          showIconButtons={showIconButtons}
          containerClassName={tileClassName}
          onClickRepost={onClickRepost}
          onClickFavorite={onClickFavorite}
          onClickShare={onClickShare}
          onTogglePlay={onTogglePlay}
          showRankIcon={showRankIcon}
          isTrending={isTrending}
          permalink={href}
        />
      </TileTrackContainer>
      {renderTracks()}
      {renderMoreTracks()}
    </div>
  )
}

export default memo(PlaylistTile)
