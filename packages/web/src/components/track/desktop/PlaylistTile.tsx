import { memo, ReactNode, useCallback } from 'react'

import {
  Scrollbar,
  IconArrowRight as IconArrow,
  Box,
  Paper
} from '@audius/harmony'
import cn from 'classnames'

import {
  TrackTileSize,
  DesktopPlaylistTileProps as PlaylistTileProps
} from 'components/track/types'

import { OwnerActionButtons } from '../OwnerActionButtons'
import { ViewerActionButtons } from '../ViewerActionButtons'

import styles from './PlaylistTile.module.css'
import TrackTile from './TrackTile'

const DefaultTileContainer = ({ children }: { children: ReactNode }) => (
  <>{children}</>
)

// mocked on-click to have paper respond to hover and press events.
// When we separate track tile from playlist tile, this will be removed.
const onClick = () => {}

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
  TileTrackContainer = DefaultTileContainer,
  source,
  playlistId
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

  if (!playlistId) {
    return null
  }

  return (
    <Paper
      direction='column'
      className={cn({
        [containerClassName!]: !!containerClassName,
        [styles.small]: size === TrackTileSize.SMALL,
        [styles.large]: size === TrackTileSize.LARGE,
        [styles.disabled]: !!isDisabled
      })}
      onClick={onClick}
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
          isStreamGated={!!streamConditions}
          streamConditions={streamConditions}
          hasStreamAccess={hasStreamAccess}
          source={source}
          collectionId={playlistId}
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
        {isOwner ? (
          <OwnerActionButtons
            contentId={playlistId}
            contentType='collection'
            isDisabled={isDisabled}
            isLoading={isLoading}
            rightActions={rightActions}
            bottomBar={bottomBar}
            isDarkMode={isDarkMode}
            isMatrixMode={isMatrixMode}
            showIconButtons={showIconButtons}
            onClickShare={onClickShare}
          />
        ) : (
          <ViewerActionButtons
            contentId={playlistId}
            contentType='collection'
            hasStreamAccess={hasStreamAccess}
            isDisabled={isDisabled}
            isLoading={isLoading}
            rightActions={rightActions}
            bottomBar={bottomBar}
            isDarkMode={isDarkMode}
            isMatrixMode={isMatrixMode}
            showIconButtons={showIconButtons}
            onClickFavorite={onClickFavorite}
            onClickRepost={onClickRepost}
            onClickShare={onClickShare}
            onClickGatedUnlockPill={onClickGatedUnlockPill}
          />
        )}
      </Box>
    </Paper>
  )
}

export default memo(PlaylistTile)
