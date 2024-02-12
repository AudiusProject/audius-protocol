import { memo, useState } from 'react'

import { imageCoverPhotoBlank } from '@audius/common/assets'
import { WidthSizes } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import cn from 'classnames'
import { FileWithPreview } from 'react-dropzone'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ClientOnly } from 'components/client-only/ClientOnly'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import ImageSelectionButton from 'components/image-selection/ImageSelectionButton'
import { useCoverPhoto } from 'hooks/useCoverPhoto'

import styles from './CoverPhoto.module.css'

const messages = {
  imageName: 'Cover Photo'
}

type CoverPhotoProps = {
  userId: Nullable<number>
  updatedCoverPhoto?: string
  className?: string
  loading?: boolean
  error?: boolean
  edit?: boolean
  darken?: boolean
  onDrop?: (
    file: FileWithPreview[],
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
}

const CoverPhoto = ({
  userId,
  updatedCoverPhoto,
  className,
  error,
  edit = false,
  darken = false,
  onDrop
}: CoverPhotoProps) => {
  const [processing, setProcessing] = useState(false)
  const gradient = darken
    ? 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 100%)'
    : 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.05) 70%, rgba(0, 0, 0, 0.2) 100%)'

  const { source: image, shouldBlur } = useCoverPhoto(
    userId,
    WidthSizes.SIZE_2000
  )
  let backgroundImage = ''
  let backgroundStyle = {}
  let immediate = false
  if (image) {
    if (image === imageCoverPhotoBlank && !updatedCoverPhoto) {
      backgroundImage = `${gradient}, url(${imageCoverPhotoBlank})`
      backgroundStyle = {
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto'
      }
    } else {
      backgroundImage = `${gradient}, url(${updatedCoverPhoto || image})`
      backgroundStyle = {
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }
    }
  } else {
    backgroundImage = gradient
    immediate = true
  }

  const handleDrop = async (
    file: Promise<FileWithPreview[]>,
    source: 'original' | 'unsplash' | 'url'
  ) => {
    setProcessing(true)
    const image = await file
    await onDrop?.(([] as FileWithPreview[]).concat(image), source)
    setProcessing(false)
  }

  const loadingElement = (
    <ClientOnly>
      <div className={cn(styles.overlay, { [styles.processing]: processing })}>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: loadingSpinner
          }}
        />
      </div>
    </ClientOnly>
  )

  return (
    <div className={cn(styles.coverPhoto, className)}>
      <DynamicImage
        image={backgroundImage}
        isUrl={false}
        wrapperClassName={styles.photo}
        imageStyle={backgroundStyle}
        usePlaceholder={false}
        immediate={immediate}
        useBlur={shouldBlur}
      >
        <div className={styles.spinner}>
          {processing ? loadingElement : null}
        </div>
      </DynamicImage>
      <div className={styles.button}>
        {edit ? (
          <ImageSelectionButton
            imageName={messages.imageName}
            hasImage={Boolean(image || updatedCoverPhoto)}
            error={!!error}
            onSelect={handleDrop}
            source='CoverPhoto'
          />
        ) : null}
      </div>
    </div>
  )
}

export default memo(CoverPhoto)
