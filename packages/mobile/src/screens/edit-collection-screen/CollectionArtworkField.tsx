import { useCallback } from 'react'

import { useGeneratePlaylistArtwork } from '@audius/common/hooks'
import { useField, useFormikContext } from 'formik'

import { PickArtworkField } from 'app/components/fields'

const messages = {
  removeArtwork: 'Remove Artwork',
  removingArtwork: 'Removing Artwork',
  updatingArtwork: 'Updating Artwork'
}

type PickArtworkFieldProps = {
  name: string
}

export const CollectionArtworkField = (props: PickArtworkFieldProps) => {
  const { name } = props
  const [{ value: artwork }, , { setValue: setArtwork }] = useField(name)
  const { url: artworkUrl } = artwork
  const [{ value: collectionId }] = useField('playlist_id')
  const [{ value: isImageAutogenerated }, , { setValue: setIsAutogenerated }] =
    useField('is_image_autogenerated')
  const [{ value: track_count }] = useField('track_count')
  const generatePlaylistArtwork = useGeneratePlaylistArtwork(collectionId)
  const { status, setStatus } = useFormikContext()

  const handleChange = useCallback(() => {
    setIsAutogenerated(false)
  }, [setIsAutogenerated])

  const handleRemove = useCallback(async () => {
    setStatus({ imageGenerating: true })
    const artwork = await generatePlaylistArtwork()
    if (!artwork) return
    setArtwork(artwork)
    setIsAutogenerated(true)
  }, [setStatus, generatePlaylistArtwork, setArtwork, setIsAutogenerated])

  const handleImageLoad = useCallback(() => {
    setStatus({ imageGenerating: false })
  }, [setStatus])

  const shouldRemoveArtwork =
    artworkUrl && !isImageAutogenerated && track_count > 0

  return (
    <PickArtworkField
      {...props}
      onPress={shouldRemoveArtwork ? handleRemove : undefined}
      onChange={handleChange}
      buttonTitle={
        status.imageGenerating && isImageAutogenerated
          ? messages.updatingArtwork
          : artworkUrl && status.imageGenerating
          ? messages.removingArtwork
          : shouldRemoveArtwork
          ? messages.removeArtwork
          : undefined
      }
      onImageLoad={handleImageLoad}
      isLoading={status.imageGenerating}
    />
  )
}