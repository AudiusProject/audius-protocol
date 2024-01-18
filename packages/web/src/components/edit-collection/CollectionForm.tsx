import {
  Collection,
  CollectionMetadata,
  Nullable,
  SquareSizes
} from '@audius/common'
import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { ArtworkField, TextAreaField, TextField } from 'components/form-fields'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { PlaylistSchema } from 'pages/upload-page/validation'

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
  saveButtonText: 'Save Changes',
  cancelButtonText: 'Cancel',
  deletePlaylistButtonText: 'Delete Playlist',
  deleteAlbumButtonText: 'Delete Album',
  createPlaylistButtonText: 'Create Playlist'
}

export type EditCollectionValues = Omit<Collection, 'artwork'> & {
  artwork: Nullable<{
    file?: Blob
    url?: string
    source?: 'unsplash' | 'original' | 'generated'
    error?: string
  }>
}

type CollectionFormProps = {
  metadata: Collection
  isAlbum?: boolean
  /** Only applies to edit mode */
  onDelete?: () => void
  /** Only applies to edit mode */
  onCancel?: () => void
  onSave: (formFields: CollectionMetadata) => void
}

const collectionFormSchema = PlaylistSchema.pick({
  artwork: true,
  playlist_name: true,
  description: true
})

const CollectionForm = ({
  isAlbum = false,
  metadata,
  onSave,
  onCancel,
  onDelete
}: CollectionFormProps) => {
  const collectionTypeName = isAlbum ? 'Album' : 'Playlist'
  const coverArtUrl = useCollectionCoverArt(
    metadata.playlist_id,
    metadata?._cover_art_sizes ? metadata._cover_art_sizes : null,
    SquareSizes.SIZE_1000_BY_1000
  )

  return (
    <Formik<EditCollectionValues>
      initialValues={{
        ...metadata,
        artwork: coverArtUrl ? { url: coverArtUrl } : null,
        description: metadata.description ?? ''
      }}
      onSubmit={onSave}
      validationSchema={toFormikValidationSchema(collectionFormSchema)}
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
          <EditActions
            deleteText={
              isAlbum
                ? messages.deleteAlbumButtonText
                : messages.deletePlaylistButtonText
            }
            saveText={messages.saveButtonText}
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

export default CollectionForm
