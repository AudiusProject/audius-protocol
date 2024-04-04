import { useCallback } from 'react'

import {
  AlbumSchema,
  CollectionValues,
  PlaylistSchema
} from '@audius/common/schemas'
import { UploadType } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'
import { Form, Formik } from 'formik'
import moment from 'moment'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ArtworkField,
  TagField,
  TextAreaField,
  TextField
} from 'components/form-fields'
import { Tile } from 'components/tile'

import { AnchoredSubmitRow } from '../components/AnchoredSubmitRow'
import { CollectionTrackFieldArray } from '../fields/CollectionTrackFieldArray'
import { ReleaseDateFieldLegacy } from '../fields/ReleaseDateFieldLegacy'
import { SelectGenreField } from '../fields/SelectGenreField'
import { SelectMoodField } from '../fields/SelectMoodField'
import { CollectionFormState } from '../types'

const messages = {
  name: 'Name',
  description: 'Description',
  trackDetails: {
    title: 'Track Details',
    description:
      "Set defaults for all tracks in this collection. Use 'Override' to personalize individual track details."
  },
  completeButton: 'Complete Upload'
}

type UploadCollectionFormProps = {
  formState: CollectionFormState
  onContinue: (formState: CollectionFormState) => void
}

export const UploadCollectionForm = (props: UploadCollectionFormProps) => {
  const { formState, onContinue } = props
  const { tracks, uploadType, metadata } = formState

  const initialValues: CollectionValues = {
    ...metadata,
    is_album: uploadType === UploadType.ALBUM,
    artwork: null,
    playlist_name: '',
    description: '',
    release_date: moment().toString(),
    trackDetails: {
      genre: null,
      mood: null,
      tags: ''
    },
    tracks: tracks.map((track) => ({ ...track, override: false }))
  }

  const handleSubmit = useCallback(
    (values: CollectionValues) => {
      onContinue({
        uploadType,
        tracks: values.tracks,
        metadata: values
      })
    },
    [onContinue, uploadType]
  )

  const collectionTypeName =
    uploadType === UploadType.ALBUM ? 'Album' : 'Playlist'

  const validationSchema =
    uploadType === UploadType.ALBUM ? AlbumSchema : PlaylistSchema

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={toFormikValidationSchema(validationSchema)}
    >
      <Form>
        <Flex inline direction='column' gap='s' css={{ minWidth: '640px' }}>
          <Tile elevation='mid'>
            <Flex direction='column' p='l' gap='l'>
              <Flex gap='l'>
                <ArtworkField
                  name='artwork'
                  size='small'
                  css={{ width: '248px', height: '248px' }}
                />
                <Flex direction='column' gap='l' css={{ flexGrow: 1 }}>
                  <TextField
                    name='playlist_name'
                    label={`${collectionTypeName} ${messages.name}`}
                    maxLength={64}
                    required
                  />
                  <TextAreaField
                    name='description'
                    aria-label={`${collectionTypeName} ${messages.description}`}
                    placeholder={`${collectionTypeName} ${messages.description}`}
                    maxLength={1000}
                    showMaxLength
                    css={{ flexGrow: 1 }}
                    grows
                  />
                </Flex>
              </Flex>
              <ReleaseDateFieldLegacy />

              <Flex ph='xl' pv='l' gap='l' direction='column'>
                <Text variant='label'>{messages.trackDetails.title}</Text>
                <Text variant='body'>{messages.trackDetails.description}</Text>
                <Flex gap='l'>
                  <SelectGenreField name='trackDetails.genre' />
                  <SelectMoodField name='trackDetails.mood' />
                </Flex>
                <TagField name='trackDetails.tags' />
              </Flex>
            </Flex>
          </Tile>
          <CollectionTrackFieldArray />
          <AnchoredSubmitRow />
        </Flex>
      </Form>
    </Formik>
  )
}
