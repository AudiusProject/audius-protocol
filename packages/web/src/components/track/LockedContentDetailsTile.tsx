import { PurchaseableContentMetadata } from '@audius/common/hooks'
import {
  SquareSizes,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  Track,
  UserMetadata,
  Collection
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
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import styles from './LockedContentDetailsTile.module.css'

const messages = {
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  premiumTrack: (contentType: 'track' | 'album') =>
    `PREMIUM ${contentType.toUpperCase()}`
}

export type LockedContentDetailsTileProps = {
  metadata: PurchaseableContentMetadata | Track | Collection
  owner: UserMetadata
  showLabel?: boolean
}

export const LockedContentDetailsTile = ({
  metadata,
  owner,
  showLabel = true
}: LockedContentDetailsTileProps) => {
  const { stream_conditions: streamConditions } = metadata
  const isAlbum = 'playlist_id' in metadata
  const contentId = isAlbum ? metadata.playlist_id : metadata.track_id
  const title = isAlbum ? metadata.playlist_name : metadata.title
  const downloadConditions = !isAlbum ? metadata.download_conditions : null
  const isDownloadGated = !isAlbum && metadata.is_download_gated

  const trackArt = useTrackCoverArt(
    contentId,
    metadata._cover_art_sizes ?? null,
    SquareSizes.SIZE_150_BY_150
  )
  const albumArt = useCollectionCoverArt(
    contentId,
    metadata._cover_art_sizes ?? null,
    SquareSizes.SIZE_150_BY_150
  )
  const image = isAlbum ? albumArt : trackArt

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
    message = messages.premiumTrack(isAlbum ? 'album' : 'track')
  } else if (isDownloadGated) {
    IconComponent = null
    message = null
  } else {
    IconComponent = IconSpecialAccess
    message = messages.specialAccess
  }

  return (
    <div className={styles.details}>
      <DynamicImage
        wrapperClassName={styles.imageWrapper}
        className={styles.image}
        image={image}
        aria-label={label}
      />
      {dogEarType ? (
        <div className={styles.dogEar}>
          <DogEar type={dogEarType} />
        </div>
      ) : null}
      <div className={styles.textWrapper}>
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
        <p className={styles.title}>{title}</p>
        <div className={styles.owner}>
          <span className={styles.by}>By</span>
          <UserLink userId={owner.user_id} className={styles.ownerName} />
        </div>
      </div>
    </div>
  )
}
