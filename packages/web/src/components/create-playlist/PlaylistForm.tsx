import { SquareSizes, Collection } from '@audius/common/models'
import { createCollectionSchema } from '@audius/common/schemas'
import { Nullable } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { PriceAndAudienceField } from 'components/edit/fields/price-and-audience'
import { ArtworkField, TextAreaField, TextField } from 'components/form-fields'
import { useCollectionCoverArt3 } from 'hooks/useCollectionCoverArt'

import { EditActions } from './FormActions'

const messages = {
  name: 'Name',
  description: 'Description',
  trackDetails: {
    title: 'Track Details',
    description:
      "Set defaults for all tracks in this collection. Use 'Override' to personalize individual track details."
  },
  completeButton: 'Complete Upload',
  editPlaylistButtonText: 'Save Changes',
  cancelButtonText: 'Cancel',
  deletePlaylistButtonText: 'Delete Playlist',
  deleteAlbumButtonText: 'Delete Album',
  createPlaylistButtonText: 'Create Playlist'
}

export type EditPlaylistValues = Omit<Collection, 'artwork'> & {
  artwork: Nullable<{
    file?: Blob
    url?: string
    source?: 'unsplash' | 'original' | 'generated'
    error?: string
  }>
}

type PlaylistFormProps = {
  metadata: Collection
  isAlbum?: boolean
  /** Only applies to edit mode */
  onDelete?: () => void
  /** Only applies to edit mode */
  onCancel?: () => void
  onSave: (
    formFields: EditPlaylistValues,
    initialValues: EditPlaylistValues
  ) => void
}

const createCollectionFormSchema = (collectionType: 'album' | 'playlist') => {
  return createCollectionSchema(collectionType).pick({
    artwork: true,
    playlist_name: true,
    description: true
  })
}

const PlaylistForm = ({
  isAlbum = false,
  metadata,
  onSave,
  onCancel,
  onDelete
}: PlaylistFormProps) => {
  const collectionTypeName = isAlbum ? 'Album' : 'Playlist'
  const coverArtUrl = useCollectionCoverArt3({
    collectionId: metadata.playlist_id,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const initialValues = {
    ...metadata,
    artwork: coverArtUrl ? { url: coverArtUrl } : null,
    description: metadata.description ?? ''
  }

  const hasNoHiddenTracks =
    metadata.tracks?.every((track) => track.is_unlisted === false) ?? false

  return (
    <Formik<EditPlaylistValues>
      initialValues={initialValues}
      onSubmit={(values) => onSave(values, initialValues)}
      validationSchema={toFormikValidationSchema(
        createCollectionFormSchema(isAlbum ? 'album' : 'playlist')
      )}
    >
      <Form>
        <Flex direction='column' w='100%' gap='2xl'>
          <Flex w='100%' gap='m'>
            <ArtworkField name='artwork' size='large' />
            <Flex direction='column' gap='m' flex={1}>
              <TextField
                name='playlist_name'
                label={`${collectionTypeName} ${messages.name}`}
                maxLength={64}
                required
              />
              <TextAreaField
                name='description'
                placeholder={`${collectionTypeName} ${messages.description}`}
                maxLength={1000}
                showMaxLength
                grows
                css={{ flexGrow: 1 }}
              />
            </Flex>
          </Flex>
          {isAlbum ? (
            <PriceAndAudienceField
              isAlbum
              isPublishDisabled={metadata.is_private && !hasNoHiddenTracks}
            />
          ) : null}
          <EditActions
            deleteText={
              isAlbum
                ? messages.deleteAlbumButtonText
                : messages.deletePlaylistButtonText
            }
            saveText={messages.editPlaylistButtonText}
            cancelText={messages.cancelButtonText}
            onCancel={onCancel}
            onDelete={onDelete}
            isForm
          />
        </Flex>
      </Form>
    </Formik>
  )
}

export default PlaylistForm
