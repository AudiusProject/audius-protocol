import { memo } from 'react'

import { SquareSizes, ID, CoverArtSizes, Remix } from '@audius/common/models'
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
  callback?: () => void
}

const TrackTileArt = ({
  id,
  className,
  showSkeleton,
  coSign,
  label,
  isBuffering,
  isPlaying,
  artworkIconClassName,
  callback
}: TrackTileArtProps) => {
  const image = useTrackCoverArt({
    trackId: id,
    size: SquareSizes.SIZE_150_BY_150
  })

  const imageProps = {
    image: showSkeleton ? '' : image,
    wrapperClassName: coSign
      ? styles.imageWrapper
      : cn(styles.container, styles.imageWrapper, className),
    'aria-label': label,
    onLoad: callback
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

const CollectionTileArt = ({
  id,
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
  const image = useCollectionCoverArt(
    id,
    coverArtSizes,
    SquareSizes.SIZE_150_BY_150
  )

  const imageProps = {
    image: showSkeleton ? '' : image,
    wrapperClassName: coSign
      ? styles.imageWrapper
      : cn(styles.container, styles.imageWrapper, className),
    'aria-label': label,
    onLoad: callback
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

const TileArt = (props: TrackTileArtProps) => {
  return props.isTrack ? (
    <TrackTileArt {...props} />
  ) : (
    <CollectionTileArt {...props} />
  )
}

export default memo(TileArt)
