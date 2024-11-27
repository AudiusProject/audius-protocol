import { memo } from 'react'

import { useGatedContentAccess } from '@audius/common/hooks'
import {
  SquareSizes,
  Color,
  ID,
  ProfilePictureSizes
} from '@audius/common/models'
import {
  cacheTracksSelectors,
  playerSelectors,
  CommonState
} from '@audius/common/store'
import cn from 'classnames'
import { useSelector } from 'react-redux'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated, useSpring } from 'react-spring'

import { Draggable } from 'components/dragndrop'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { LockedStatusBadge } from 'components/locked-status-badge'
import UserBadges from 'components/user-badges/UserBadges'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { fullTrackPage } from 'utils/route'

import styles from './PlayingTrackInfo.module.css'
const { getTrack } = cacheTracksSelectors
const { getPreviewing } = playerSelectors

const messages = {
  preview: 'Preview'
}

interface PlayingTrackInfoProps {
  trackId: number
  isOwner: boolean
  trackTitle: string
  trackPermalink: string
  profilePictureSizes: ProfilePictureSizes
  isVerified: boolean
  isTrackUnlisted: boolean
  isStreamGated: boolean
  artistUserId: ID
  artistName: string
  artistHandle: string
  hasShadow: boolean
  dominantColor?: Color
  onClickTrackTitle: () => void
  onClickArtistName: () => void
}

const springProps = {
  from: { opacity: 0.6 },
  to: { opacity: 1 },
  reset: true,
  config: { tension: 240, friction: 25 }
}

const PlayingTrackInfo = ({
  trackId,
  isOwner,
  trackTitle,
  trackPermalink,
  artistUserId,
  artistName,
  onClickTrackTitle,
  onClickArtistName,
  isTrackUnlisted,
  isStreamGated,
  hasShadow,
  dominantColor
}: PlayingTrackInfoProps) => {
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const { hasStreamAccess } = useGatedContentAccess(track)
  const isPreviewing = useSelector(getPreviewing)
  const shouldShowPreviewLock =
    isPreviewing ||
    (track?.stream_conditions &&
      'usdc_purchase' in track.stream_conditions &&
      !hasStreamAccess)

  const spring = useSpring(springProps)
  const profileImage = useProfilePicture({
    userId: artistUserId ?? null,
    size: SquareSizes.SIZE_150_BY_150
  })

  const boxShadowStyle =
    hasShadow && dominantColor
      ? {
          boxShadow: `0px 3px 5px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.5), 0px 3px 4px rgba(133, 129, 153, 0.25)`
        }
      : {}

  const renderTrackTitle = () => {
    return (
      <animated.div style={spring} className={styles.trackTitleContainer}>
        <div
          className={cn(styles.trackTitle, {
            [styles.textShadow]: hasShadow
          })}
          onClick={onClickTrackTitle}
        >
          {trackTitle}
        </div>
        {shouldShowPreviewLock ? (
          <LockedStatusBadge
            locked
            iconSize='2xs'
            coloredWhenLocked
            variant='premium'
            text={messages.preview}
          />
        ) : null}
      </animated.div>
    )
  }

  return (
    <div className={styles.info}>
      <div className={styles.profilePictureWrapper}>
        <DynamicImage
          image={profileImage}
          onClick={onClickArtistName}
          className={cn(styles.profilePicture, {
            [styles.isDefault]: !!trackId
          })}
          imageStyle={boxShadowStyle}
          usePlaceholder={false}
        />
      </div>
      <div className={styles.text}>
        {isStreamGated ? (
          renderTrackTitle()
        ) : (
          <Draggable
            isDisabled={!trackTitle || isTrackUnlisted}
            text={trackTitle}
            isOwner={isOwner}
            kind='track'
            id={trackId}
            link={fullTrackPage(trackPermalink)}
          >
            {renderTrackTitle()}
          </Draggable>
        )}
        <animated.div style={spring} className={styles.artistNameWrapper}>
          <div
            className={cn(styles.artistName, {
              [styles.textShadow]: hasShadow
            })}
            onClick={onClickArtistName}
          >
            {artistName}
          </div>
          <UserBadges
            userId={artistUserId}
            badgeSize={12}
            className={styles.iconVerified}
          />
        </animated.div>
      </div>
    </div>
  )
}

export default memo(PlayingTrackInfo)
