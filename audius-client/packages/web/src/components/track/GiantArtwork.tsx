import React, { memo, useEffect } from 'react'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt } from 'hooks/useImageSize'
import { CoverArtSizes, SquareSizes } from 'models/common/ImageSizes'
import CoSign from 'components/co-sign/CoSign'
import { Remix } from 'models/Track'

import styles from './GiantArtwork.module.css'
import { Size } from 'components/co-sign/types'

type GiantArtworkProps = {
  trackId: number
  coverArtSizes: CoverArtSizes
  coSign: Remix
  callback: () => void
}

const GiantArtwork = ({
  trackId,
  coverArtSizes,
  coSign,
  callback
}: GiantArtworkProps) => {
  const image = useTrackCoverArt(
    trackId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000,
    ''
  )
  useEffect(() => {
    if (image) callback()
  }, [image, callback])
  return coSign ? (
    <CoSign
      size={Size.XLARGE}
      hasFavorited={coSign.has_remix_author_saved}
      hasReposted={coSign.has_remix_author_reposted}
      coSignName={coSign.user.name}
      className={styles.giantArtwork}
      userId={coSign.user?.user_id}
    >
      <DynamicImage wrapperClassName={styles.imageWrapper} image={image} />
    </CoSign>
  ) : (
    <div className={styles.giantArtwork}>
      <DynamicImage wrapperClassName={styles.imageWrapper} image={image} />
    </div>
  )
}

export default memo(GiantArtwork)
