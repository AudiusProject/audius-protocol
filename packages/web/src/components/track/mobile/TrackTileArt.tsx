import { memo } from 'react'

import { ID, CoverArtSizes, SquareSizes, Remix } from '@audius/common'
import { useLoadImageWithTimeout } from '@audius/common/hooks'
import cn from 'classnames'

import CoSign from 'components/co-sign/CoSign'
import { Size } from 'components/co-sign/types'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import { ArtworkIcon } from '../Artwork'

import styles from './TrackTileArt.module.css'

type TrackTileArtProps = {
  isTrack: boolean
  id: ID
  coverArtSizes: CoverArtSizes
  className?: string
  showSkeleton?: boolean
  coSign?: Remix | null
  label?: string
  isPlaying?: boolean
  isBuffering?: boolean
  artworkIconClassName?: string
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
  isBuffering,
  isPlaying,
  artworkIconClassName,
  callback
}: TrackTileArtProps) => {
  const useImage = isTrack ? useTrackCoverArt : useCollectionCoverArt
  const image = useImage(id, coverArtSizes, SquareSizes.SIZE_150_BY_150)

  useLoadImageWithTimeout(image, callback)

  const imageProps = {
    image: showSkeleton ? '' : image,
    wrapperClassName: coSign
      ? styles.imageWrapper
      : cn(styles.container, styles.imageWrapper, className),
    'aria-label': label
  }

  const renderImage = () => (
    <DynamicImage {...imageProps}>
      <ArtworkIcon
        isBuffering={!!isBuffering}
        isPlaying={!!isPlaying}
        artworkIconClassName={artworkIconClassName}
      />
    </DynamicImage>
  )

  return coSign ? (
    <CoSign
      size={Size.SMALL}
      className={cn(styles.container, className)}
      hasFavorited={coSign.has_remix_author_saved}
      hasReposted={coSign.has_remix_author_reposted}
      coSignName={coSign.user.name}
      userId={coSign.user.user_id}
    >
      {renderImage()}
    </CoSign>
  ) : (
    renderImage()
  )
}

export default memo(TrackTileArt)
