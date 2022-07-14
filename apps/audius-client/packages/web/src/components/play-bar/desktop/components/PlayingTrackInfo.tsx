import { memo, useEffect } from 'react'

import { ID } from '@audius/common'
import cn from 'classnames'
import { animated, useSpring } from 'react-spring'

import Color from 'common/models/Color'
import { ProfilePictureSizes, SquareSizes } from 'common/models/ImageSizes'
import Draggable from 'components/dragndrop/Draggable'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
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
  profilePictureSizes,
  artistUserId,
  artistName,
  onClickTrackTitle,
  onClickArtistName,
  isTrackUnlisted,
  hasShadow,
  dominantColor
}: PlayingTrackInfoProps) => {
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

  const boxShadowStyle =
    hasShadow && dominantColor
      ? {
          boxShadow: `0px 3px 5px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.5), 0px 3px 4px rgba(133, 129, 153, 0.25)`
        }
      : {}

  return (
    <div className={styles.info}>
      <div className={styles.profilePictureWrapper}>
        <DynamicImage
          image={image}
          onClick={onClickArtistName}
          className={cn(styles.profilePicture, {
            [styles.isDefault]: !!trackId
          })}
          imageStyle={boxShadowStyle}
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
          link={fullTrackPage(trackPermalink)}>
          <animated.div style={trackSpringProps}>
            <div
              className={cn(styles.trackTitle, {
                [styles.textShadow]: hasShadow
              })}
              onClick={onClickTrackTitle}>
              {trackTitle}
            </div>
          </animated.div>
        </Draggable>
        <animated.div
          className={styles.artistNameWrapper}
          style={artistSpringProps}>
          <div
            className={cn(styles.artistName, {
              [styles.textShadow]: hasShadow
            })}
            onClick={onClickArtistName}>
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

export default memo(PlayingTrackInfo)
