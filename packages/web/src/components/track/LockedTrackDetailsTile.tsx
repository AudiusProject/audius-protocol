import {
  getDogEarType,
  ID,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  SquareSizes,
  Track,
  UserMetadata
} from '@audius/common'
import { IconCart, IconCollectible, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'

import { Icon } from 'components/Icon'
import { DogEar } from 'components/dog-ear'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import typeStyles from 'components/typography/typography.module.css'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { profilePage } from 'utils/route'

import styles from './LockedTrackDetailsTile.module.css'

const messages = {
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  premiumTrack: 'PREMIUM TRACK'
}

export type LockedTrackDetailsTileProps = {
  trackId: ID
}

export const LockedTrackDetailsTile = ({
  track,
  owner
}: {
  track: Track
  owner: UserMetadata
}) => {
  const {
    track_id: trackId,
    title,
    stream_conditions: streamConditions
  } = track
  const image = useTrackCoverArt(
    trackId,
    track._cover_art_sizes ?? null,
    SquareSizes.SIZE_150_BY_150,
    ''
  )

  const dogEarType = getDogEarType({
    streamConditions
  })
  const label = `${title} by ${owner.name}`
  const isCollectibleGated = isContentCollectibleGated(streamConditions)
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)

  let IconComponent = IconSpecialAccess
  let message = messages.specialAccess

  if (isCollectibleGated) {
    IconComponent = IconCollectible
    message = messages.collectibleGated
  } else if (isUSDCPurchaseGated) {
    IconComponent = IconCart
    message = messages.premiumTrack
  }

  return (
    <div className={styles.trackDetails}>
      <DynamicImage
        wrapperClassName={styles.trackImageWrapper}
        className={styles.trackImage}
        image={image}
        aria-label={label}
      />
      {dogEarType ? (
        <div className={styles.dogEar}>
          <DogEar type={dogEarType} />
        </div>
      ) : null}
      <div className={styles.trackTextWrapper}>
        <div
          className={cn(styles.gatedContentLabel, {
            [styles.usdcContentLabel]: isUSDCPurchaseGated
          })}
        >
          <Icon size='small' icon={IconComponent} />
          <span>{message}</span>
        </div>
        <p className={styles.trackTitle}>{title}</p>
        <div className={styles.trackOwner}>
          <span className={styles.by}>By</span>
          <a
            className={cn(typeStyles.link, styles.trackOwnerName)}
            href={profilePage(owner.handle)}
          >
            {owner.name}
          </a>
          <UserBadges
            userId={owner.user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
            inline
          />
        </div>
      </div>
    </div>
  )
}
