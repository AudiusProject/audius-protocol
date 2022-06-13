import cn from 'classnames'
import PropTypes from 'prop-types'
import ReactDropzone from 'react-dropzone'

import { ReactComponent as IconUpload } from 'assets/img/iconUpload.svg'
import { ALLOWED_IMAGE_FILE_TYPES } from 'utils/imageProcessingUtil'

import styles from './Dropzone.module.css'

const messages = {
  track: 'Drag-and-drop a track here, or ',
  image: 'Drag-and-drop an image here, or ',
  stem: 'Drag-and-drop audio files here, or ',
  browse: 'browse to upload'
}

const Dropzone = ({
  className,
  titleTextClassName,
  messageClassName,
  iconClassName,
  type,
  textAboveIcon,
  allowMultiple,
  onDrop,
  subtitle,
  disabled,
  disableClick
}) => {
  const getMessage = () => {
    if (subtitle) return subtitle
    let message
    switch (type) {
      case 'track':
        message = messages.track
        break
      case 'image':
        message = messages.image
        break
      case 'stem':
      default:
        message = messages.stem
    }

    return (
      <>
        {message}
        <span className={styles.link}>{messages.browse}</span>
      </>
    )
  }

  return (
    <ReactDropzone
      multiple={allowMultiple}
      onDrop={onDrop}
      className={cn(styles.dropzone, className)}
      disabled={disabled}
      disableClick={disabled || disableClick}
      accept={
        type === 'image' ? ALLOWED_IMAGE_FILE_TYPES.join(', ') : 'audio/*'
      }
      data-testid='upload-dropzone'
    >
      <div className={styles.hoverBoundingBox}>
        <span className={styles.contentWrapper}>
          {textAboveIcon ? (
            <div className={cn(styles.textAboveIcon, titleTextClassName)}>
              {textAboveIcon}
            </div>
          ) : null}
          <IconUpload className={cn(styles.iconUpload, iconClassName)} />
          <div className={cn(styles.text, messageClassName)}>
            {getMessage()}
          </div>
        </span>
      </div>
    </ReactDropzone>
  )
}

Dropzone.propTypes = {
  className: PropTypes.string,
  messageClassName: PropTypes.string,
  titleTextClassName: PropTypes.string,
  iconClassName: PropTypes.string,
  type: PropTypes.oneOf(['track', 'image', 'stem']).isRequired,
  // Extra text content to be displayed inside the dropzone.
  textAboveIcon: PropTypes.string,
  subtitle: PropTypes.string,
  allowMultiple: PropTypes.bool,
  onDrop: PropTypes.func,
  disabled: PropTypes.bool
}

Dropzone.defaultProps = {
  type: 'track',
  allowMultiple: true,
  disabled: false
}

export default Dropzone
