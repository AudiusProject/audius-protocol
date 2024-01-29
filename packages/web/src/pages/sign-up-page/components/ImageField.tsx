import { ReactNode, useCallback } from 'react'

import { Nullable } from '@audius/common'
import { finishProfilePageMessages as messages } from '@audius/common/messages'
import cn from 'classnames'
import { useField } from 'formik'
import ReactDropzone, { DropFilesEventHandler } from 'react-dropzone'

import {
  ALLOWED_IMAGE_FILE_TYPES,
  ResizeImageOptions,
  resizeImage
} from 'utils/imageProcessingUtil'

import styles from './ImageField.module.css'

const allowedImages = ALLOWED_IMAGE_FILE_TYPES.join(', ')

export type ImageFieldValue = Nullable<{
  file: File
  url: string
}>

type ImageFieldProps = {
  name: string
  className?: string
  children: (urlValue: ImageFieldValue | null) => ReactNode | ReactNode[]
  onChange?: (image: ImageFieldValue) => void
  onError?: (e: Error) => void
  imageResizeOptions?: Partial<ResizeImageOptions>
}

export const ImageField = (props: ImageFieldProps) => {
  const { name, className, children, onChange, onError, imageResizeOptions } =
    props

  const [field, , { setValue, setError }] = useField<ImageFieldValue>(name)
  const { value } = field

  const handleChange: DropFilesEventHandler = useCallback(
    async (files) => {
      try {
        const [file] = files
        const resizedFile = await resizeImage(
          file,
          imageResizeOptions?.maxWidth,
          imageResizeOptions?.square
        )
        const url = URL.createObjectURL(resizedFile)
        const image = { file: resizedFile, url }
        setValue(image)
        if (onChange) {
          onChange(image)
        }
      } catch (e) {
        onError?.(e as Error)
        setError(messages[`${name}UploadError` as keyof typeof messages])
      }
    },
    [
      imageResizeOptions?.maxWidth,
      imageResizeOptions?.square,
      setValue,
      onChange,
      onError,
      setError,
      name
    ]
  )

  return (
    <ReactDropzone
      onDrop={handleChange}
      data-testid={`${name}-dropzone`}
      accept={allowedImages}
      className={cn(styles.defaultStyles, className)}
    >
      {children(value)}
    </ReactDropzone>
  )
}
