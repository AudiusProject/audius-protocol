import { useCallback } from 'react'

import { EditPlaylistValues, Nullable } from '@audius/common'
import { Form, Formik } from 'formik'
import { capitalize } from 'lodash'
import moment from 'moment'

import {
  ArtworkField,
  TagField,
  TextAreaField,
  TextField
} from 'components/form-fields'
import { Tile } from 'components/tile'
import { Text } from 'components/typography'

import { TrackForUpload } from '../components/types'
import { ReleaseDateField } from '../fields/ReleaseDateField'
import { SelectGenreField } from '../fields/SelectGenreField'
import { SelectMoodField } from '../fields/SelectMoodField'
import { CollectionTrackForUpload } from '../types'

import { CollectionTrackFieldArray } from './CollectionTrackFieldArray'
import styles from './UploadCollectionForm.module.css'

const messages = {
  name: 'Name',
  description: 'Description',
  trackDetails: {
    title: 'Track Details',
    description:
      "Set defaults for all tracks in this collection. Use 'Override' to personalize individual track details."
  }
}

type UploadCollectionFormProps = {
  collectionType: 'album' | 'playlist'
  tracks: TrackForUpload[]
  onSubmit: () => void
}

type CollectionValues = Pick<
  EditPlaylistValues,
  'artwork' | 'playlist_name' | 'description'
> & {
  releaseDate: string
  trackDetails: {
    genre: Nullable<string>
    mood: Nullable<string>
    tags: string
  }
  tracks: CollectionTrackForUpload[]
}

export const UploadCollectionForm = (props: UploadCollectionFormProps) => {
  const { collectionType, tracks, onSubmit } = props

  const initialValues: CollectionValues = {
    artwork: { url: '' },
    playlist_name: '',
    description: '',
    releaseDate: moment().startOf('day').toString(),
    trackDetails: {
      genre: null,
      mood: null,
      tags: ''
    },
    tracks: tracks.map((track) => ({ ...track, override: false }))
  }

  const handleSubmit = useCallback(
    (values: CollectionValues) => {
      onSubmit()
    },
    [onSubmit]
  )

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <Form className={styles.root}>
        <Tile className={styles.collectionFields}>
          <div className={styles.row}>
            <ArtworkField name='artwork' className={styles.artwork} />
            <div className={styles.collectionInfo}>
              <TextField
                name='playlist_name'
                label={`${capitalize(collectionType)} ${messages.name}`}
                required
              />
              <TextAreaField
                name='description'
                placeholder={`${capitalize(collectionType)} ${
                  messages.description
                }`}
                maxLength={1000}
                showMaxLength
                className={styles.description}
              />
            </div>
          </div>
          <ReleaseDateField />
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
      </Form>
    </Formik>
  )
}
