import { useCallback } from 'react'

import {
  AlbumSchema,
  CollectionValues,
  PlaylistSchema
} from '@audius/common/schemas'
import { UploadType } from '@audius/common/store'
import { Text } from '@audius/harmony'
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

import styles from './EditCollectionForm.module.css'

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

type EditCollectionFormProps = {
  formState: CollectionFormState
  onContinue: (formState: CollectionFormState) => void
}

export const EditCollectionForm = (props: EditCollectionFormProps) => {
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
        tracks,
        metadata: values
      })
    },
    [onContinue, uploadType, tracks]
  )

  const collectionTypeName =
    uploadType === UploadType.ALBUM ? 'Album' : 'Playlist'

  const validationSchema =
    uploadType === UploadType.ALBUM ? AlbumSchema : PlaylistSchema

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      // @ts-ignore
      validationSchema={toFormikValidationSchema(validationSchema)}
    >
      <Form className={styles.root}>
        <Tile className={styles.collectionFields} elevation='mid'>
          <div className={styles.row}>
            <ArtworkField
              name='artwork'
              className={styles.artwork}
              size='small'
            />
            <div className={styles.collectionInfo}>
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
                className={styles.description}
                grows
              />
            </div>
          </div>
          <ReleaseDateFieldLegacy />

          <div className={styles.trackDetails}>
            <Text variant='label'>{messages.trackDetails.title}</Text>
            <Text>{messages.trackDetails.description}</Text>
            <div className={styles.row}>
              <SelectGenreField name='trackDetails.genre' />
              <SelectMoodField name='trackDetails.mood' />
            </div>
            <TagField name='trackDetails.tags' />
          </div>
        </Tile>
        <CollectionTrackFieldArray />
        <AnchoredSubmitRow />
      </Form>
    </Formik>
  )
}
