import React, { useState, useEffect } from 'react'
import { PlaylistTileProps } from 'components/track/types'
import { UID, ID } from 'models/common/Identifiers'

import styles from './PlaylistTile.module.css'

import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import cn from 'classnames'
import { formatCount } from 'utils/formatUtil'
import { formatSeconds } from 'utils/timeUtil'
import Skeleton from 'components/general/Skeleton'
import BottomButtons from './BottomButtons'
import TrackTileArt from './TrackTileArt'
import FavoriteButton from 'components/general/alt-button/FavoriteButton'
import RepostButton from 'components/general/alt-button/RepostButton'
import { LineupTrack } from 'models/Track'
import UserBadges from 'containers/user-badges/UserBadges'

type TrackItemProps = {
  index: number
  track: LineupTrack
  active: boolean
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
        <div className={styles.index}> {props.index + 1} </div>
        <div className={styles.trackTitle}> {props.track.title} </div>
        <div className={styles.byArtist}> {`by ${props.track.user.name}`} </div>
      </div>
    </>
  )
}

type TrackListProps = {
  activeTrackUid: UID | null
  tracks: LineupTrack[]
  goToCollectionPage: (e: React.MouseEvent<HTMLElement>) => void
}

const TrackList = (props: TrackListProps) => {
  return (
    <div onClick={props.goToCollectionPage}>
      {props.tracks.slice(0, DISPLAY_TRACK_COUNT).map((track, index) => (
        <TrackItem
          key={track.uid}
          active={props.activeTrackUid === track.uid}
          index={index}
          track={track}
        />
      ))}
      {props.tracks.length > 5 && (
        <>
          <div className={styles.trackItemDivider}></div>
          <div className={cn(styles.trackItem, styles.trackItemMore)}>
            {`+${props.tracks.length - DISPLAY_TRACK_COUNT} more tracks`}
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
  goToCollectionPage: (e: React.MouseEvent<HTMLElement>) => void
  goToArtistPage: (e: React.MouseEvent<HTMLElement>) => void
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  togglePlay: () => void
  makeGoToRepostsPage: (id: ID) => (e: React.MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (id: ID) => (e: React.MouseEvent<HTMLElement>) => void
  isOwner: boolean
  darkMode: boolean
}

const PlaylistTile = (props: PlaylistTileProps & ExtraProps) => {
  const { hasLoaded, index, showSkeleton } = props
  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !showSkeleton) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, showSkeleton])

  const fadeIn = {
    [styles.show]: artworkLoaded,
    [styles.hide]: !artworkLoaded
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
            })}
          >
            <div className={styles.title} onClick={props.goToCollectionPage}>
              <div className={cn(fadeIn)}>{props.playlistTitle}</div>
              {props.isPlaying && <IconVolume />}
              {!artworkLoaded && (
                <Skeleton
                  className={styles.skeleton}
                  width='80%'
                  height='80%'
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
              {!artworkLoaded && (
                <Skeleton
                  className={styles.skeleton}
                  width='80%'
                  height='80%'
                />
              )}
            </div>
          </div>
        </div>
        <div className={cn(styles.stats, styles.statText)}>
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
                }
              >
                {formatCount(props.saveCount)}
                <FavoriteButton
                  iconMode
                  isDarkMode={props.darkMode}
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
                }
              >
                {formatCount(props.repostCount)}
                <RepostButton
                  iconMode
                  isDarkMode={props.darkMode}
                  className={styles.repostButton}
                />
              </div>
            </>
          )}
        </div>
        {artworkLoaded && (
          <TrackList
            activeTrackUid={props.activeTrackUid}
            goToCollectionPage={props.goToCollectionPage}
            tracks={props.tracks}
          />
        )}
        <BottomButtons
          hasSaved={props.hasCurrentUserSaved}
          hasReposted={props.hasCurrentUserReposted}
          toggleSave={props.toggleSave}
          toggleRepost={props.toggleRepost}
          onShare={props.onShare}
          onClickOverflow={props.onClickOverflow}
          isOwner={props.isOwner}
          darkMode={props.darkMode}
        />
      </div>
    </div>
  )
}

export default PlaylistTile
