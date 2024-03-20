import { memo, useEffect } from 'react'

import { SquareSizes, CoverArtSizes, Remix } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'

import CoSign from 'components/co-sign/CoSign'
import { Size } from 'components/co-sign/types'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { StaticImage } from 'components/static-image/StaticImage'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { useSsrContext } from 'ssr/SsrContext'

import styles from './GiantArtwork.module.css'

type GiantArtworkProps = {
  trackId: number
  coverArtSizes: Nullable<CoverArtSizes>
  coSign: Nullable<Remix>
  callback: () => void
  cid: Nullable<string>
}

const GiantArtwork = ({
  cid,
  trackId,
  coverArtSizes,
  coSign,
  callback
}: GiantArtworkProps) => {
  const { isSsrEnabled } = useSsrContext()
  const image = useTrackCoverArt(
    trackId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000,
    ''
  )
  useEffect(() => {
    if (image) callback()
  }, [image, callback])

  const imageElement = isSsrEnabled ? (
    <StaticImage
      fullWidth
      wrapperClassName={styles.imageWrapper}
      cid={cid}
      alt='Track Artwork'
    />
  ) : (
    <DynamicImage wrapperClassName={styles.imageWrapper} image={image} />
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
