import { memo, useEffect } from 'react'

import { SquareSizes, Remix } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'

import CoSign from 'components/co-sign/CoSign'
import { Size } from 'components/co-sign/types'
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
  const { trackId, coSign, callback } = props
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

  return coSign ? (
    <CoSign
      size={Size.XLARGE}
      hasFavorited={coSign.has_remix_author_saved}
      hasReposted={coSign.has_remix_author_reposted}
      coSignName={coSign.user.name}
      className={styles.giantArtwork}
      userId={coSign.user?.user_id}
    >
      {imageElement}
    </CoSign>
  ) : (
    <div className={styles.giantArtwork}>{imageElement}</div>
  )
}

export default memo(GiantArtwork)
