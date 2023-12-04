import { useState } from 'react'

import { getErrorMessage } from '@audius/common'
import { useField, useFormikContext } from 'formik'

import { HelperText } from 'components/data-entry/HelperText'
import UploadArtwork, {
  UploadArtworkProps
} from 'components/upload/UploadArtwork'
import { TrackEditFormValues } from 'pages/upload-page/types'
import { resizeImage } from 'utils/imageProcessingUtil'

type ArtworkFieldProps = Partial<UploadArtworkProps> & {
  name: string
  size: 'small' | 'large'
}

export const ArtworkField = (props: ArtworkFieldProps) => {
  const { name, ...other } = props
  const { submitCount } = useFormikContext<TrackEditFormValues>()
  const [field, { touched, error }, { setValue }] = useField(name)
  const { value, ...otherField } = field
  const [imageProcessingError, setImageProcessingError] = useState(false)

  const handleDropArtwork = async (selectedFiles: File[], source: string) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      // @ts-ignore writing to read-only property. Maybe bugged?
      file.name = selectedFiles[0].name
      const url = URL.createObjectURL(file)
      setValue({ url, file, source })
      setImageProcessingError(false)
    } catch (err) {
      console.error(getErrorMessage(err))
      setImageProcessingError(true)
    }
  }

  const hasError = Boolean((touched || submitCount > 0) && error)

  return (
    <div>
      <UploadArtwork
        {...otherField}
        artworkUrl={value?.url}
        onDropArtwork={handleDropArtwork}
        imageProcessingError={imageProcessingError}
        {...other}
      />
      {hasError ? <HelperText error={hasError}>{error}</HelperText> : null}
    </div>
  )
}
