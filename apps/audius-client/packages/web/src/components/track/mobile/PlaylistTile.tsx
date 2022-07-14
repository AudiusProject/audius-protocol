import { useState, useEffect, MouseEvent } from 'react'

import { UID, ID } from '@audius/common'
import cn from 'classnames'
import { range } from 'lodash'

import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { LineupTrack } from 'common/models/Track'
import { formatCount } from 'common/utils/formatUtil'
import { formatSeconds } from 'common/utils/timeUtil'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import Skeleton from 'components/skeleton/Skeleton'
import { PlaylistTileProps } from 'components/track/types'
import UserBadges from 'components/user-badges/UserBadges'

import BottomButtons from './BottomButtons'
import styles from './PlaylistTile.module.css'
import { RankIcon } from './TrackTile'
import TrackTileArt from './TrackTileArt'

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
        })}>
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
      <>
        {range(numLoadingSkeletonRows).map((i) => (
          <TrackItem key={i} active={false} index={i} forceSkeleton />
        ))}
      </>
    )
  }

  return (
    <div onClick={goToCollectionPage}>
      {tracks.slice(0, DISPLAY_TRACK_COUNT).map((track, index) => (
        <TrackItem
          key={track.uid}
          active={activeTrackUid === track.uid}
          index={index}
          track={track}
        />
      ))}
      {trackCount && trackCount > 5 && (
        <>
          <div className={styles.trackItemDivider}></div>
          <div className={cn(styles.trackItem, styles.trackItemMore)}>
            {`+${trackCount - tracks.length} more tracks`}
          </div>
        </>
      )}
    </div>
  )
}

type ExtraProps = {
  index: number
  isLoading: boolean
  isPlaying: boolean
  isActive: boolean
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
  goToArtistPage: (e: MouseEvent<HTMLElement>) => void
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  togglePlay: () => void
  makeGoToRepostsPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  isOwner: boolean
  darkMode: boolean
  isMatrix: boolean
}

const PlaylistTile = (props: PlaylistTileProps & ExtraProps) => {
  const {
    hasLoaded,
    index,
    showSkeleton,
    numLoadingSkeletonRows,
    isTrending,
    showRankIcon,
    trackCount
  } = props
  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !showSkeleton) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, showSkeleton])

  const shouldShow = artworkLoaded && !showSkeleton
  const fadeIn = {
    [styles.show]: shouldShow,
    [styles.hide]: !shouldShow
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent} onClick={props.togglePlay}>
        <div className={cn(styles.duration, styles.statText, fadeIn)}>
          {formatSeconds(props.duration)}
        </div>
        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack={false}
            showSkeleton={props.showSkeleton}
            callback={() => setArtworkLoaded(true)}
            coverArtSizes={props.coverArtSizes}
            className={styles.albumArtContainer}
          />
          <div
            className={cn(styles.titles, {
              [styles.titlesActive]: props.isActive
            })}>
            <div className={styles.title} onClick={props.goToCollectionPage}>
              <div className={cn(fadeIn)}>{props.playlistTitle}</div>
              {props.isPlaying && <IconVolume />}
              {!shouldShow && (
                <Skeleton
                  className={styles.skeleton}
                  width='90px'
                  height='16px'
                />
              )}
            </div>
            <div className={styles.artist} onClick={props.goToArtistPage}>
              <span className={cn(styles.userName, fadeIn)}>
                {props.artistName}
              </span>
              <UserBadges
                userId={props.ownerId}
                badgeSize={10}
                className={styles.iconVerified}
              />
              {!shouldShow && (
                <Skeleton
                  className={styles.skeleton}
                  width='180px'
                  height='16px'
                />
              )}
            </div>
          </div>
        </div>
        <div className={cn(styles.stats, styles.statText)}>
          <RankIcon
            className={styles.rankIcon}
            index={index}
            isVisible={isTrending && shouldShow}
            showCrown={showRankIcon}
          />
          {!!(props.repostCount || props.saveCount) && (
            <>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.saveCount
                })}
                onClick={
                  props.saveCount
                    ? props.makeGoToFavoritesPage(props.id)
                    : undefined
                }>
                {formatCount(props.saveCount)}
                <FavoriteButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.favoriteButton}
                />
              </div>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.repostCount
                })}
                onClick={
                  props.repostCount
                    ? props.makeGoToRepostsPage(props.id)
                    : undefined
                }>
                {formatCount(props.repostCount)}
                <RepostButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.repostButton}
                />
              </div>
            </>
          )}
        </div>
        <TrackList
          activeTrackUid={props.activeTrackUid}
          goToCollectionPage={props.goToCollectionPage}
          tracks={props.tracks}
          isLoading={showSkeleton}
          numLoadingSkeletonRows={numLoadingSkeletonRows}
          trackCount={trackCount}
        />
        <div className={cn(fadeIn)}>
          <BottomButtons
            hasSaved={props.hasCurrentUserSaved}
            hasReposted={props.hasCurrentUserReposted}
            toggleSave={props.toggleSave}
            toggleRepost={props.toggleRepost}
            onShare={props.onShare}
            onClickOverflow={props.onClickOverflow}
            isOwner={props.isOwner}
            isDarkMode={props.darkMode}
            isMatrixMode={props.isMatrix}
          />
        </div>
      </div>
    </div>
  )
}

export default PlaylistTile
