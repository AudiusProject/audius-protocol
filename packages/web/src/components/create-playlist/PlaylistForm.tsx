import {
  Collection,
  CollectionMetadata,
  DeepNullable,
  Nullable
} from '@audius/common'
import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'

import { ArtworkField, TextAreaField, TextField } from 'components/form-fields'
import { ReleaseDateField } from 'pages/upload-page/fields/ReleaseDateField'

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

export type EditPlaylistValuess = Partial<Collection> & {
  artwork: {
    file: Blob
    url: string
    source: 'unsplash' | 'original' | 'generated'
    error?: string
  }
  is_current: boolean
  mood: Nullable<string>
  created_at: Nullable<string>
  tags: Nullable<string>
  genre: Nullable<string>
  isAlbum: boolean
} & DeepNullable<
    Pick<
      CollectionMetadata,
      | 'is_private'
      | 'updated_at'
      | 'cover_art'
      | 'cover_art_sizes'
      | 'playlist_name'
      | 'playlist_owner_id'
      | 'save_count'
      | 'upc'
      | 'description'
    >
  >

type PlaylistFormProps = {
  metadata: CollectionMetadata
  isAlbum?: boolean
  /** Only applies to edit mode */
  onDelete?: () => void
  /** Only applies to edit mode */
  onCancel?: () => void
  onSave: (formFields: CollectionMetadata) => void
}

const PlaylistForm = ({
  isAlbum = false,
  metadata,
  onSave,
  onCancel,
  onDelete
}: PlaylistFormProps) => {
  const collectionTypeName = isAlbum ? 'Album' : 'Playlist'
  return (
    <Formik initialValues={metadata} onSubmit={onSave}>
      {({ values }) => (
        <Form>
          <Flex direction='column' w='100%' p='l' gap='xl'>
            <Flex w='100%' gap='m'>
              <ArtworkField name='artwork' />
              <Flex direction='column' h={218} gap='m' flex={1}>
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
                />
              </Flex>
            </Flex>
            <ReleaseDateField />
            {/* <div>
            <Text variant='label'>{messages.trackDetails.title}</Text>
            <Text>{messages.trackDetails.description}</Text>
            <div>
              <SelectGenreField name='trackDetails.genre' />
              <SelectMoodField name='trackDetails.mood' />
            </div>
            <TagField name='trackDetails.tags' />
          </div> */}
          </Flex>
          {/* <CollectionTrackFieldArray /> */}
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
            onSave={() => onSave(values)}
          />
        </Form>
      )}
    </Formik>
  )
}

export default PlaylistForm
