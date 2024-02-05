import { memo, MouseEvent } from 'react'

import { SquareSizes, ID, CoverArtSizes } from '@audius/common/models'
import {
  IconRemove as IconRemoveTrack,
  IconPlaybackPause as IconPause,
  IconPlaybackPlay as IconPlay,
  IconDrag,
  IconKebabHorizontal,
  IconLock
} from '@audius/harmony'
import { IconButton } from '@audius/stems'
import cn from 'classnames'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { SeoLink } from 'components/link'
import { TablePlayButton } from 'components/table/components/TablePlayButton'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { profilePage } from 'utils/route'

import styles from './TrackListItem.module.css'

export enum TrackItemAction {
  Save = 'save',
  Overflow = 'overflow'
}

type ArtworkIconProps = {
  isLoading: boolean
  isPlaying: boolean
}

const ArtworkIcon = ({ isLoading, isPlaying }: ArtworkIconProps) => {
  let artworkIcon
  if (isLoading) {
    artworkIcon = (
      <div className={styles.loadingAnimation}>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: loadingSpinner
          }}
        />
      </div>
    )
  } else if (isPlaying) {
    artworkIcon = <IconPause />
  } else {
    artworkIcon = <IconPlay />
  }
  return <div className={styles.artworkIcon}>{artworkIcon}</div>
}

type ArtworkProps = {
  trackId: ID
  isLoading: boolean
  isActive?: boolean
  isPlaying: boolean
  coverArtSizes: CoverArtSizes
}
const Artwork = ({
  trackId,
  isPlaying,
  isActive,
  isLoading,
  coverArtSizes
}: ArtworkProps) => {
  const image = useTrackCoverArt(
    trackId,
    coverArtSizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={styles.artworkContainer}>
      <div
        className={cn(styles.artwork, {})}
        style={
          image
            ? {
                backgroundImage: `url(${image})`
              }
            : {}
        }
      >
        {isActive ? (
          <ArtworkIcon isLoading={isLoading} isPlaying={isPlaying} />
        ) : null}
      </div>
    </div>
  )
}

const getMessages = ({ isDeleted = false }: { isDeleted?: boolean } = {}) => ({
  deleted: isDeleted ? ' [Deleted By Artist]' : '',
  locked: 'Locked'
})

export type TrackListItemProps = {
  className?: string
  index: number
  isLoading: boolean
  isStreamGated?: boolean
  isSaved?: boolean
  isReposted?: boolean
  isActive?: boolean
  isPlaying?: boolean
  isRemoveActive?: boolean
  isDeleted: boolean
  isLocked: boolean
  coverArtSizes?: CoverArtSizes
  artistName: string
  artistHandle: string
  trackTitle: string
  trackId: ID
  userId: ID
  permalink: string
  uid?: string
  isReorderable?: boolean
  isDragging?: boolean
  onRemove?: (trackId: ID) => void
  togglePlay?: (uid: string, trackId: ID) => void
  onClickOverflow?: () => void
  trackItemAction?: TrackItemAction
}

const TrackListItem = ({
  className,
  isLoading,
  index,
  isActive = false,
  isPlaying = false,
  isRemoveActive = false,
  artistName,
  artistHandle,
  trackTitle,
  permalink,
  trackId,
  userId,
  uid,
  coverArtSizes,
  isDeleted,
  isLocked,
  onRemove,
  togglePlay,
  trackItemAction,
  onClickOverflow,
  isReorderable = false,
  isDragging = false
}: TrackListItemProps) => {
  const messages = getMessages({ isDeleted })

  const onClickTrack = () => {
    if (uid && !isLocked && !isDeleted && togglePlay) togglePlay(uid, trackId)
  }

  const onRemoveTrack = (e: MouseEvent<Element>) => {
    e.stopPropagation()
    if (onRemove) onRemove(index)
  }

  return (
    <div
      className={cn(styles.trackContainer, className, {
        [styles.isActive]: isActive,
        [styles.isDeleted]: isDeleted,
        [styles.isReorderable]: isReorderable,
        [styles.isDragging]: isDragging
      })}
      onClick={onClickTrack}
    >
      {coverArtSizes ? (
        <div>
          <Artwork
            trackId={trackId}
            coverArtSizes={coverArtSizes}
            isActive={isActive}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
        </div>
      ) : isActive && !isDeleted ? (
        <div className={styles.playButtonContainer}>
          <TablePlayButton
            playing={true}
            paused={!isPlaying}
            hideDefault={false}
          />
        </div>
      ) : null}
      {isReorderable && <IconDrag className={styles.dragIcon} />}

      <div className={styles.nameArtistContainer}>
        <SeoLink
          to={permalink}
          className={cn(styles.trackTitle, {
            [styles.lockedTrackTitle]: !isDeleted && isLocked
          })}
        >
          {trackTitle}
          {messages.deleted}
        </SeoLink>
        <SeoLink to={profilePage(artistHandle)} className={styles.artistName}>
          {artistName}
          <UserBadges
            userId={userId}
            badgeSize={12}
            className={cn(styles.badges, {
              [styles.lockedBadges]: !isDeleted && isLocked
            })}
          />
        </SeoLink>
      </div>
      {!isDeleted && isLocked ? (
        <div className={styles.locked}>
          <IconLock />
          <span>{messages.locked}</span>
        </div>
      ) : null}
      {onClickOverflow && trackItemAction === TrackItemAction.Overflow && (
        <div className={styles.iconContainer}>
          <IconButton
            aria-label='more actions'
            icon={<IconKebabHorizontal />}
            className={styles.kebabContainer}
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              onClickOverflow()
            }}
          />
        </div>
      )}
      {onRemove && (
        <div className={styles.iconContainer}>
          <IconButton
            aria-label='remove track'
            icon={<IconRemoveTrack />}
            className={cn(styles.removeTrackContainer, {
              [styles.isRemoveActive]: isRemoveActive
            })}
            onClick={onRemoveTrack}
          />
        </div>
      )}
    </div>
  )
}

export default memo(TrackListItem)
