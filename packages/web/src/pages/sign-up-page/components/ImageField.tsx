import { useCallback } from 'react'

import { Nullable } from '@audius/common'
import { useField } from 'formik'
import ReactDropzone, { DropFilesEventHandler } from 'react-dropzone'

import {
  ALLOWED_IMAGE_FILE_TYPES,
  resizeImage
} from 'utils/imageProcessingUtil'

const allowedImages = ALLOWED_IMAGE_FILE_TYPES.join(', ')

type ImageFieldProps = {
  name: string
  className: string
}

type ImageFieldValue = Nullable<{
  file: File
  url: string
}>

export const ImageField = (props: ImageFieldProps) => {
  const { name, className } = props

  const [field, , { setValue }] = useField<ImageFieldValue>(name)
  const { value } = field

  const handleChange: DropFilesEventHandler = useCallback(
    async (files) => {
      const [file] = files
      const resizedFile = await resizeImage(file)
      const url = URL.createObjectURL(resizedFile)
      setValue({ file: resizedFile, url })
    },
    [setValue]
  )

  return (
    <ReactDropzone
      onDrop={handleChange}
      data-testid={`${name}-dropzone`}
      accept={allowedImages}
      className={className}
    >
      <img className={className} src={value?.url} />
    </ReactDropzone>
  )
}
