import { memo, ReactNode, useCallback } from 'react'

import { Scrollbar, IconArrowRight as IconArrow, Box } from '@audius/harmony'
import cn from 'classnames'

import {
  TrackTileSize,
  DesktopPlaylistTileProps as PlaylistTileProps
} from 'components/track/types'

import { BottomRow } from './BottomRow'
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
  isUnlisted,
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
  showIconButtons = true,
  containerClassName,
  tileClassName,
  tracksContainerClassName,
  onClickTitle,
  onClickRepost,
  onClickFavorite,
  onClickShare,
  onTogglePlay,
  onClickGatedUnlockPill,
  trackList,
  trackCount,
  isTrending,
  showRankIcon,
  href,
  hasStreamAccess,
  streamConditions,
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
          streamConditions={streamConditions}
          hasStreamAccess={hasStreamAccess}
        />
      </TileTrackContainer>
      <Box backgroundColor='surface1' borderTop='strong' borderBottom='strong'>
        {renderTracks()}
        {renderMoreTracks()}
      </Box>
      <Box
        pv='s'
        ph='m'
        backgroundColor='white'
        borderLeft='default'
        borderRight='default'
        borderBottom='default'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        <BottomRow
          hasStreamAccess={hasStreamAccess}
          isDisabled={isDisabled}
          isLoading={isLoading}
          isFavorited={isFavorited}
          isReposted={isReposted}
          rightActions={rightActions}
          bottomBar={bottomBar}
          isUnlisted={isUnlisted}
          isOwner={isOwner}
          isDarkMode={isDarkMode}
          isMatrixMode={isMatrixMode}
          showIconButtons={showIconButtons}
          onClickRepost={onClickRepost}
          onClickFavorite={onClickFavorite}
          onClickShare={onClickShare}
          onClickGatedUnlockPill={onClickGatedUnlockPill}
          streamConditions={streamConditions}
        />
      </Box>
    </div>
  )
}

export default memo(PlaylistTile)
