import {
  Flex,
  Text,
  TextLink,
  useTheme,
  IconCloudUpload as IconUpload
} from '@audius/harmony'
import cn from 'classnames'
import ReactDropzone from 'react-dropzone'

import { ALLOWED_IMAGE_FILE_TYPES } from 'utils/imageProcessingUtil'

import styles from './Dropzone.module.css'

const messages = {
  track: 'Drag-and-drop your files here, or',
  image: 'Drag-and-drop an image here, or',
  stem: 'Drag-and-drop audio files here, or',
  browse: 'browse to upload'
}

type DropzoneProps = {
  className?: string
  messageClassName?: string
  titleTextClassName?: string
  subtitleTextClassName?: string
  iconClassName?: string
  type?: 'track' | 'image' | 'stem'
  // Extra text content to be displayed inside the dropzone.
  textAboveIcon?: string
  subtextAboveIcon?: string
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
  isTruncated?: boolean
}

export const Dropzone = ({
  className,
  titleTextClassName,
  subtitleTextClassName,
  messageClassName,
  iconClassName,
  type = 'track',
  textAboveIcon,
  subtextAboveIcon,
  allowMultiple = true,
  onDropAccepted,
  onDropRejected,
  subtitle,
  disabled = false,
  disableClick,
  isTruncated
}: DropzoneProps) => {
  const { color } = useTheme()
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
      <Flex alignItems='center'>
        {isTruncated ? (
          <IconUpload
            className={cn(styles.iconUpload, iconClassName, {
              [styles.truncated]: isTruncated
            })}
          />
        ) : null}
        <Text variant='body'>
          {message}&nbsp;
          <TextLink css={{ color: color.primary.p500 }}>
            {messages.browse}
          </TextLink>
        </Text>
      </Flex>
    )
  }

  return (
    <ReactDropzone
      multiple={allowMultiple}
      onDropAccepted={onDropAccepted}
      onDropRejected={onDropRejected}
      className={cn(styles.dropzone, className, {
        [styles.truncated]: isTruncated
      })}
      disabled={disabled}
      disableClick={disabled || disableClick}
      accept={
        type === 'image' ? ALLOWED_IMAGE_FILE_TYPES.join(', ') : 'audio/*'
      }
      data-testid='upload-dropzone'
    >
      <div className={styles.hoverBoundingBox}>
        <span className={styles.contentWrapper}>
          {!isTruncated ? (
            <>
              {textAboveIcon ? (
                <div className={cn(styles.textAboveIcon, titleTextClassName)}>
                  {textAboveIcon}
                </div>
              ) : null}
              {subtextAboveIcon ? (
                <Text size='s' variant='body' className={subtitleTextClassName}>
                  {subtextAboveIcon}
                </Text>
              ) : null}
              <IconUpload className={cn(styles.iconUpload, iconClassName)} />
            </>
          ) : null}
          <div className={cn(styles.text, messageClassName)}>
            {getMessage()}
          </div>
        </span>
      </div>
    </ReactDropzone>
  )
}
