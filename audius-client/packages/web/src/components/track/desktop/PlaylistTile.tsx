import React, { memo, ReactChildren } from 'react'

import TrackTile from './TrackTile'
import cn from 'classnames'
import SimpleBar from 'simplebar-react'
import {
  TrackTileSize,
  DesktopPlaylistTileProps as PlaylistTileProps
} from 'components/track/types'
import styles from './PlaylistTile.module.css'

const DefaultTileConatiner = ({ children }: { children: ReactChildren }) =>
  children

const PlaylistTile = memo(
  ({
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
    TileTrackContainer = DefaultTileConatiner
  }: PlaylistTileProps) => {
    const bar = (
      <SimpleBar
        className={cn(styles.playlistTracks, {
          [tracksContainerClassName!]: !!tracksContainerClassName
        })}
      >
        {trackList}
      </SimpleBar>
    )

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
            onClickTitle={onClickTitle}
            onClickRepost={onClickRepost}
            onClickFavorite={onClickFavorite}
            onClickShare={onClickShare}
            onTogglePlay={onTogglePlay}
          />
        </TileTrackContainer>
        {bar}
      </div>
    )
  }
)

export default PlaylistTile
