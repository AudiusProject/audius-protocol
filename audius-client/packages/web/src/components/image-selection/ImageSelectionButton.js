import { useRef, useState } from 'react'

import { Button, IconCamera, ButtonType } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'
import ReactDropzone from 'react-dropzone'

import InvalidFileType from 'components/upload/InvalidFileType'
import { ALLOWED_IMAGE_FILE_TYPES } from 'utils/imageProcessingUtil'

import styles from './ImageSelectionButton.module.css'
import ImageSelectionPopup from './ImageSelectionPopup'
import { ImageSelectionProps, ImageSelectionDefaults } from './PropTypes'

const messages = {
  add: 'Add',
  change: 'Change'
}

const ImageSelectionButton = ({
  wrapperClassName,
  buttonClassName,
  isMobile,
  hasImage,
  imageName,
  error,
  includePopup,
  onOpenPopup,
  onClosePopup,
  onClick,
  onAfterClose,
  onSelect,
  source
}) => {
  const anchorRef = useRef()
  const [showModal, setShowModal] = useState(false)

  const closeModal = () => {
    setShowModal(false)
    if (onClosePopup) onClosePopup()
  }
  const openModal = () => {
    setShowModal(true)
    if (onOpenPopup) onOpenPopup()
  }

  const handleClick = () => {
    if (!showModal) {
      onClick()
      openModal()
    }
  }

  let buttonText = hasImage ? messages.change : messages.add
  if (imageName) buttonText += ` ${imageName}`

  return (
    <div className={cn(styles.wrapper, wrapperClassName)}>
      {includePopup ? (
        <>
          <Button
            ref={anchorRef}
            className={cn(styles.button, buttonClassName, {
              [styles.hide]: showModal
            })}
            text={buttonText}
            leftIcon={<IconCamera />}
            type={ButtonType.WHITE}
            onClick={handleClick}
          />
          <ImageSelectionPopup
            anchorRef={anchorRef}
            className={styles.popup}
            error={error}
            isVisible={showModal}
            onSelect={onSelect}
            onClose={closeModal}
            onAfterClose={onAfterClose}
            source={source}
          />
        </>
      ) : (
        <>
          <ReactDropzone
            onDrop={onSelect}
            className={styles.dropzone}
            accept={ALLOWED_IMAGE_FILE_TYPES.join(', ')}
            data-testid='upload-photo-dropzone'
          >
            <Button
              className={cn(styles.button, styles.noPopup, {
                [styles.hide]: hasImage
              })}
              text={buttonText}
              leftIcon={<IconCamera />}
              type={ButtonType.WHITE}
              onClick={handleClick}
            />
          </ReactDropzone>
          {error ? (
            <InvalidFileType className={styles.invalidFileType} />
          ) : null}
        </>
      )}
    </div>
  )
}

ImageSelectionButton.propTypes = {
  wrapperClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  hasImage: PropTypes.bool.isRequired,
  // The name of the image (e.g. render the button as Add "Artwork" or Add "Cover Photo")
  imageName: PropTypes.string,
  // Whether or not to show the image selection modal. Otherwise, the
  // button itself is the dropzone.
  includePopup: PropTypes.bool,
  onOpenPopup: PropTypes.func,
  onClosePopup: PropTypes.func,
  onClick: PropTypes.func,
  ...ImageSelectionProps
}

ImageSelectionButton.defaultProps = {
  hasImage: false,
  isMobile: false,
  includePopup: true,
  onClick: () => {},
  ...ImageSelectionDefaults
}

export default ImageSelectionButton
