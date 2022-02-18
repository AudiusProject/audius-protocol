import React, { useState, useEffect } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import placeholderArt from 'assets/img/imageBlank2x.png'
import ImageSelectionButton from 'components/image-selection/ImageSelectionButton'
import Toast from 'components/toast/Toast'

import styles from './UploadArtwork.module.css'

const messages = {
  imageName: 'Artwork'
}

const UploadArtwork = props => {
  const [processing, setProcessing] = useState(false)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    if (props.error) {
      setShowTip(true)
      setTimeout(() => {
        setShowTip(false)
      }, 4000)
    }
  }, [props.error])

  const onDrop = async (file, source) => {
    setProcessing(true)
    const image = await file
    await props.onDropArtwork([].concat(image), source)
    setProcessing(false)
  }

  return (
    <div
      className={cn(styles.uploadArtwork, {
        [styles.error]: props.error
      })}
    >
      <div
        className={styles.artworkWrapper}
        style={{
          backgroundImage: `url(${
            props.artworkUrl || (processing ? '' : placeholderArt)
          })`
        }}
      >
        <div
          className={cn(styles.overlay, { [styles.processing]: processing })}
        >
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: loadingSpinner
            }}
          />
        </div>
      </div>
      <div className={styles.button}>
        <ImageSelectionButton
          imageName={messages.imageName}
          hasImage={!!props.artworkUrl}
          error={props.imageProcessingError}
          onOpenPopup={props.onOpenPopup}
          onClosePopup={props.onClosePopup}
          onSelect={onDrop}
          source='UploadArtwork'
        />
      </div>
      <div className={styles.toast}>
        <Toast
          text='No artwork? Pick from our library instead!'
          placement='bottom'
          fireOnClick={false}
          mount='parent'
          open={showTip}
        />
      </div>
    </div>
  )
}

UploadArtwork.propTypes = {
  artworkurl: PropTypes.string,
  onDropArtwork: PropTypes.func,
  // Whether or not there is an error with the entire image upload (red border)
  error: PropTypes.bool,
  // Whether or not there was an error processing the uploaded image (error message in upload)
  imageProcessingError: PropTypes.bool,
  onOpenPopup: PropTypes.func,
  onClosePopup: PropTypes.func,
  mount: PropTypes.oneOf(['parent', 'page', 'body'])
}

UploadArtwork.defaultProps = {
  artworkUrl: '',
  mount: 'page'
}

export default UploadArtwork
