import React, { useEffect } from 'react'

import cn from 'classnames'
import { animated, useSpring } from 'react-spring'

import { ID } from 'common/models/Identifiers'
import { ProfilePictureSizes, SquareSizes } from 'common/models/ImageSizes'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Draggable from 'containers/dragndrop/Draggable'
import UserBadges from 'containers/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useImageSize'
import { fullTrackPage } from 'utils/route'

import styles from './PlayingTrackInfo.module.css'

interface PlayingTrackInfoProps {
  trackId: number
  isOwner: boolean
  trackTitle: string
  trackPermalink: string
  profilePictureSizes: ProfilePictureSizes
  isVerified: boolean
  isTrackUnlisted: boolean
  artistUserId: ID
  artistName: string
  artistHandle: string
  onClickTrackTitle: () => void
  onClickArtistName: () => void
}

const springProps = {
  from: { opacity: 0.6 },
  to: { opacity: 1 },
  reset: true,
  config: { tension: 240, friction: 25 }
}

const PlayingTrackInfo: React.FC<PlayingTrackInfoProps> = ({
  trackId,
  isOwner,
  trackTitle,
  trackPermalink,
  profilePictureSizes,
  artistUserId,
  artistName,
  artistHandle,
  onClickTrackTitle,
  onClickArtistName,
  isVerified,
  isTrackUnlisted
}) => {
  const [artistSpringProps, setArtistSpringProps] = useSpring(() => springProps)
  const [trackSpringProps, setTrackSpringProps] = useSpring(() => springProps)
  const image = useUserProfilePicture(
    artistUserId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  useEffect(() => {
    setArtistSpringProps(springProps)
  }, [artistUserId, setArtistSpringProps])

  useEffect(() => {
    setTrackSpringProps(springProps)
  }, [trackTitle, setTrackSpringProps])

  return (
    <div className={styles.info}>
      <div className={styles.profilePictureWrapper}>
        <DynamicImage
          image={image}
          onClick={onClickArtistName}
          className={cn(styles.profilePicture, {
            [styles.isDefault]: !!trackId
          })}
          initialOpacity={0.6}
          immediatelyLeave
          usePlaceholder={false}
        />
      </div>
      <div className={styles.text}>
        <Draggable
          isDisabled={!trackTitle || isTrackUnlisted}
          text={trackTitle}
          isOwner={isOwner}
          kind='track'
          id={trackId}
          link={fullTrackPage(trackPermalink)}
        >
          <animated.div style={trackSpringProps}>
            <div className={styles.trackTitle} onClick={onClickTrackTitle}>
              {trackTitle}
            </div>
          </animated.div>
        </Draggable>
        <animated.div
          className={styles.artistNameWrapper}
          style={artistSpringProps}
        >
          <div className={styles.artistName} onClick={onClickArtistName}>
            {artistName}
          </div>
          <UserBadges
            userId={artistUserId}
            badgeSize={10}
            className={styles.iconVerified}
          />
        </animated.div>
      </div>
    </div>
  )
}

export default React.memo(PlayingTrackInfo)
