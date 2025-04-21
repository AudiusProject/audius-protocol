import { memo, useEffect } from 'react'

import { SquareSizes, Remix } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'

import TrackFlair from 'components/track-flair/TrackFlair'
import { Size } from 'components/track-flair/types'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import styles from './GiantArtwork.module.css'

type GiantArtworkProps = {
  trackId: number
  coSign: Nullable<Remix>
  callback: () => void
}

const messages = {
  artworkAltText: 'Track Artwork'
}

const GiantArtwork = (props: GiantArtworkProps) => {
  const { trackId, callback } = props
  const image = useTrackCoverArt({
    trackId,
    size: SquareSizes.SIZE_1000_BY_1000
  })
  useEffect(() => {
    if (image) callback()
  }, [image, callback])

  const imageElement = (
    <DynamicImage
      wrapperClassName={styles.imageWrapper}
      image={image}
      alt={messages.artworkAltText}
    />
  )

  return (
    <TrackFlair size={Size.XLARGE} className={styles.giantArtwork} id={trackId}>
      {imageElement}
    </TrackFlair>
  )
}

export default memo(GiantArtwork)
