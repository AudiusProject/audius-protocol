import React, { memo, useState } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import { WidthSizes } from 'common/models/ImageSizes'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import ImageSelectionButton from 'components/image-selection/ImageSelectionButton'
import { useUserCoverPhoto } from 'hooks/useImageSize'

import styles from './CoverPhoto.module.css'

const messages = {
  imageName: 'Cover Photo'
}

const CoverPhoto = props => {
  const [processing, setProcessing] = useState(false)
  const gradient = props.darken
    ? 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 100%)'
    : 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.05) 70%, rgba(0, 0, 0, 0.2) 100%)'

  const image = useUserCoverPhoto(
    props.userId,
    props.coverPhotoSizes,
    WidthSizes.SIZE_2000
  )
  let backgroundImage = {}
  let backgroundStyle = {}
  let immediate = false
  if (props.coverPhotoSizes) {
    if (image === imageCoverPhotoBlank && !props.updatedCoverPhoto) {
      backgroundImage = `${gradient}, url(${imageCoverPhotoBlank})`
      backgroundStyle = {
        backgroundRepeat: 'repeat',
        backgroundSize: '100% 100%, 35%'
      }
    } else {
      backgroundImage = `${gradient}, url(${props.updatedCoverPhoto || image})`
      backgroundStyle = {
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }
    }
  } else {
    backgroundImage = gradient
    immediate = true
  }

  const onDrop = async (file, source) => {
    setProcessing(true)
    const image = await file
    await props.onDrop([].concat(image), source)
    setProcessing(false)
  }

  const loading = (
    <div className={cn(styles.overlay, { [styles.processing]: processing })}>
      <Lottie
        options={{ loop: true, autoplay: true, animationData: loadingSpinner }}
      />
    </div>
  )

  return (
    <div className={cn(styles.coverPhoto, props.className)}>
      <DynamicImage
        image={backgroundImage}
        isUrl={false}
        wrapperClassName={styles.photo}
        imageStyle={backgroundStyle}
        usePlaceholder={false}
        immediate={immediate}
      >
        <div className={styles.spinner}>{processing ? loading : null}</div>
      </DynamicImage>
      <div className={styles.button}>
        {props.edit ? (
          <ImageSelectionButton
            imageName={messages.imageName}
            hasImage={!!image || props.updatedCoverPhoto}
            error={!!props.error}
            onSelect={onDrop}
            source='CoverPhoto'
          />
        ) : null}
      </div>
    </div>
  )
}

CoverPhoto.propTypes = {
  userId: PropTypes.number,
  coverPhotoSizes: PropTypes.object,
  updatedCoverPhoto: PropTypes.string,
  className: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  edit: PropTypes.bool,
  darken: PropTypes.bool,
  onDrop: PropTypes.func
}

CoverPhoto.defaultProps = {
  loading: false,
  edit: false,
  darken: false,
  onDrop: () => {}
}

export default memo(CoverPhoto)
