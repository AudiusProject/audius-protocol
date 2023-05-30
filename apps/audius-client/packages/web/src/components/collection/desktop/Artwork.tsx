import { ComponentType, SVGProps, useCallback, useEffect } from 'react'

import { CoverArtSizes, SquareSizes } from '@audius/common'
import { Button, ButtonType, IconPencil } from '@audius/stems'
import { useDispatch } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { open as openEditCollectionModal } from 'store/application/ui/editPlaylistModal/slice'

import styles from './CollectionHeader.module.css'

const messages = {
  changeArtwork: 'Change Artwork'
}

type ArtworkProps = {
  collectionId: number
  coverArtSizes: CoverArtSizes
  callback: () => void
  gradient?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  imageOverride?: string
  isOwner: boolean
}

export const Artwork = (props: ArtworkProps) => {
  const {
    collectionId,
    coverArtSizes,
    callback,
    gradient,
    icon: Icon,
    imageOverride,
    isOwner
  } = props

  const dispatch = useDispatch()

  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000
  )

  useEffect(() => {
    // If there's a gradient, this is a smart collection. Just immediately call back
    if (image || gradient || imageOverride) callback()
  }, [image, callback, gradient, imageOverride])

  const handleEditArtwork = useCallback(() => {
    dispatch(
      openEditCollectionModal({ collectionId, initialFocusedField: 'artwork' })
    )
  }, [dispatch, collectionId])

  return (
    <DynamicImage
      wrapperClassName={styles.coverArtWrapper}
      className={styles.coverArt}
      image={gradient || imageOverride || image}
    >
      {Icon ? (
        <Icon className={styles.imageIcon} style={{ background: gradient }} />
      ) : null}
      {isOwner ? (
        <span className={styles.imageEditButtonWrapper}>
          <Button
            type={ButtonType.WHITE}
            text={messages.changeArtwork}
            onClick={handleEditArtwork}
            leftIcon={<IconPencil />}
          />
        </span>
      ) : null}
    </DynamicImage>
  )
}
