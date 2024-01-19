import cn from 'classnames'
import ReactDropzone from 'react-dropzone'

import IconUpload from 'assets/img/iconUpload.svg'
import { ALLOWED_IMAGE_FILE_TYPES } from 'utils/imageProcessingUtil'

import styles from './Dropzone.module.css'

const messages = {
  track: 'Drag-and-drop your files here, or ',
  image: 'Drag-and-drop an image here, or ',
  stem: 'Drag-and-drop audio files here, or ',
  browse: 'browse to upload'
}

type DropzoneProps = {
  className?: string
  messageClassName?: string
  titleTextClassName?: string
  iconClassName?: string
  type?: 'track' | 'image' | 'stem'
  // Extra text content to be displayed inside the dropzone.
  textAboveIcon?: string
  subtitle?: string
  allowMultiple?: boolean
  /**
   * Callback fired when the user drops files onto the dropzone
   */
  onDropAccepted: (files: File[]) => void
  /**
   * Callback fired when the dropped file is rejected, usually
   * from a disallowed file type
   */
  onDropRejected?: (files: File[]) => void
  disabled?: boolean
  disableClick?: boolean
}

export const Dropzone = ({
  className,
  titleTextClassName,
  messageClassName,
  iconClassName,
  type = 'track',
  textAboveIcon,
  allowMultiple = true,
  onDropAccepted,
  onDropRejected,
  subtitle,
  disabled = false,
  disableClick
}: DropzoneProps) => {
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
      onDropAccepted={onDropAccepted}
      onDropRejected={onDropRejected}
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
