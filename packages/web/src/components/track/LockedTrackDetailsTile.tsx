import {
  SquareSizes,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID,
  Track,
  UserMetadata
} from '@audius/common/models'
import { getDogEarType, Nullable } from '@audius/common/utils'
import {
  IconCart,
  IconCollectible,
  IconComponent,
  IconSpecialAccess,
  useTheme
} from '@audius/harmony'
import cn from 'classnames'

import { DogEar } from 'components/dog-ear'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

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
  owner,
  showLabel = true
}: {
  track: Track
  owner: UserMetadata
  showLabel?: boolean
}) => {
  const {
    track_id: trackId,
    title,
    stream_conditions: streamConditions,
    download_conditions: downloadConditions,
    is_download_gated: isDownloadGated
  } = track
  const image = useTrackCoverArt(
    trackId,
    track._cover_art_sizes ?? null,
    SquareSizes.SIZE_150_BY_150,
    ''
  )

  const dogEarType = getDogEarType({
    streamConditions,
    downloadConditions
  })
  const label = `${title} by ${owner.name}`
  const isCollectibleGated = isContentCollectibleGated(streamConditions)
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  const { color } = useTheme()

  let IconComponent: Nullable<IconComponent>
  let message: Nullable<string>

  if (isCollectibleGated) {
    IconComponent = IconCollectible
    message = messages.collectibleGated
  } else if (isUSDCPurchaseGated) {
    IconComponent = IconCart
    message = messages.premiumTrack
  } else if (isDownloadGated) {
    IconComponent = null
    message = null
  } else {
    IconComponent = IconSpecialAccess
    message = messages.specialAccess
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
        {showLabel && IconComponent && message ? (
          <div
            className={cn(styles.gatedContentLabel, {
              [styles.usdcContentLabel]: isUSDCPurchaseGated
            })}
          >
            <IconComponent
              size='s'
              fill={
                isUSDCPurchaseGated
                  ? color.special.lightGreen
                  : color.special.blue
              }
            />
            <span>{message}</span>
          </div>
        ) : null}
        <p className={styles.trackTitle}>{title}</p>
        <div className={styles.trackOwner}>
          <span className={styles.by}>By</span>
          <UserLink userId={owner.user_id} className={styles.trackOwnerName} />
        </div>
      </div>
    </div>
  )
}
