import { ComponentType, SVGProps, useEffect } from 'react'

import { CoverArtSizes, SquareSizes } from '@audius/common'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'

import styles from './CollectionHeader.module.css'

type ArtworkProps = {
  collectionId: number
  coverArtSizes: CoverArtSizes
  callback: () => void
  gradient?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  imageOverride?: string
}

export const Artwork = (props: ArtworkProps) => {
  const {
    collectionId,
    coverArtSizes,
    callback,
    gradient,
    icon: Icon,
    imageOverride
  } = props

  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000
  )

  useEffect(() => {
    // If there's a gradient, this is a smart collection. Just immediately call back
    if (image || gradient || imageOverride) callback()
  }, [image, callback, gradient, imageOverride])

  return (
    <div className={styles.coverArtWrapper}>
      <DynamicImage
        className={styles.coverArt}
        image={gradient || imageOverride || image}
      >
        {Icon ? (
          <Icon className={styles.imageIcon} style={{ background: gradient }} />
        ) : null}
      </DynamicImage>
    </div>
  )
}
