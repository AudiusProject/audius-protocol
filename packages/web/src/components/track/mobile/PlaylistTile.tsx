import { useState, useEffect, MouseEvent } from 'react'

import { ID, UID, LineupTrack } from '@audius/common/models'
import { formatCount, formatLineupTileDuration } from '@audius/common/utils'
import { Flex, IconVolumeLevel2 as IconVolume, Text } from '@audius/harmony'
import cn from 'classnames'
import { range } from 'lodash'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import { TextLink, UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { PlaylistTileProps } from 'components/track/types'

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
        })}
      >
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
      {trackCount && trackCount > DISPLAY_TRACK_COUNT ? (
        <>
          <div className={styles.trackItemDivider}></div>
          <div className={cn(styles.trackItem, styles.trackItemMore)}>
            {`+${trackCount - DISPLAY_TRACK_COUNT} more tracks`}
          </div>
        </>
      ) : null}
    </div>
  )
}

type ExtraProps = {
  index: number
  isLoading: boolean
  isPlaying: boolean
  isActive: boolean
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
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
    trackCount,
    variant,
    containerClassName,
    permalink,
    isActive,
    playlistTitle,
    isPlaying,
    ownerId
  } = props
  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !showSkeleton) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, showSkeleton])

  const isReadonly = variant === 'readonly'
  const shouldShow = artworkLoaded && !showSkeleton
  const fadeIn = {
    [styles.show]: shouldShow,
    [styles.hide]: !shouldShow
  }

  return (
    <div
      className={cn(
        styles.container,
        { [styles.readonly]: isReadonly },
        containerClassName
      )}
    >
      <div
        css={{ overflow: 'hidden' }}
        className={styles.mainContent}
        onClick={props.togglePlay}
      >
        <div className={cn(styles.duration, styles.statText, fadeIn)}>
          {formatLineupTileDuration(props.duration)}
        </div>

        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack={false}
            showSkeleton={props.showSkeleton}
            callback={() => setArtworkLoaded(true)}
            coverArtSizes={props.coverArtSizes}
            className={styles.albumArtContainer}
            isPlaying={props.isPlaying}
            isBuffering={props.isLoading}
            artworkIconClassName={styles.artworkIcon}
          />
          <Flex
            direction='column'
            justifyContent='center'
            gap='2xs'
            mt='m'
            mr='m'
            flex='0 1 65%'
            css={{ overflow: 'hidden' }}
          >
            <TextLink
              to={permalink ?? ''}
              textVariant='title'
              isActive={isActive}
              applyHoverStylesToInnerSvg
            >
              <Text ellipses className={cn(fadeIn)}>
                {playlistTitle}
                {playlistTitle}
                {playlistTitle}
                {playlistTitle}
                {playlistTitle}
                {playlistTitle}
              </Text>
              {isPlaying ? <IconVolume size='m' /> : null}
              {!shouldShow ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </TextLink>
            <UserLink userId={ownerId} textVariant='body' badgeSize='xs'>
              {!shouldShow ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </UserLink>
          </Flex>
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
                  props.saveCount && !isReadonly
                    ? props.makeGoToFavoritesPage(props.id)
                    : undefined
                }
              >
                {formatCount(props.saveCount)}
                <FavoriteButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.favoriteButton}
                  wrapperClassName={styles.favoriteButtonWrapper}
                />
              </div>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.repostCount
                })}
                onClick={
                  props.repostCount && !isReadonly
                    ? props.makeGoToRepostsPage(props.id)
                    : undefined
                }
              >
                {formatCount(props.repostCount)}
                <RepostButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.repostButton}
                  wrapperClassName={styles.repostButtonWrapper}
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
        {!isReadonly ? (
          <div className={cn(fadeIn)}>
            <BottomButtons
              hasSaved={props.hasCurrentUserSaved}
              hasReposted={props.hasCurrentUserReposted}
              toggleSave={props.toggleSave}
              toggleRepost={props.toggleRepost}
              onShare={props.onShare}
              onClickOverflow={props.onClickOverflow}
              isLoading={props.isLoading}
              isOwner={props.isOwner}
              isDarkMode={props.darkMode}
              isMatrixMode={props.isMatrix}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PlaylistTile
