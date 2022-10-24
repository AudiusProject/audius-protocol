import { memo } from 'react'

import {
  ID,
  CoverArtSizes,
  SquareSizes,
  Remix,
  useLoadImageWithTimeout
} from '@audius/common'
import cn from 'classnames'

import CoSign from 'components/co-sign/CoSign'
import { Size } from 'components/co-sign/types'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import styles from './TrackTileArt.module.css'

type TrackTileArtProps = {
  isTrack: boolean
  id: ID
  coverArtSizes: CoverArtSizes
  className?: string
  showSkeleton?: boolean
  coSign?: Remix | null
  label?: string
  // Called when the image is done loading
  callback: () => void
}

const TrackTileArt = ({
  id,
  isTrack,
  className,
  coverArtSizes,
  showSkeleton,
  coSign,
  label,
  callback
}: TrackTileArtProps) => {
  const useImage = isTrack ? useTrackCoverArt : useCollectionCoverArt
  const image = useImage(id, coverArtSizes, SquareSizes.SIZE_150_BY_150)

  useLoadImageWithTimeout(image, callback)

  return coSign ? (
    <CoSign
      size={Size.SMALL}
      className={cn(styles.container, className)}
      hasFavorited={coSign.has_remix_author_saved}
      hasReposted={coSign.has_remix_author_reposted}
      coSignName={coSign.user.name}
      userId={coSign.user.user_id}
    >
      <DynamicImage
        image={showSkeleton ? '' : image}
        wrapperClassName={styles.imageWrapper}
        aria-label={label}
      />
    </CoSign>
  ) : (
    <DynamicImage
      image={showSkeleton ? '' : image}
      wrapperClassName={cn(styles.container, styles.imageWrapper, className)}
      aria-label={label}
    />
  )
}

export default memo(TrackTileArt)
