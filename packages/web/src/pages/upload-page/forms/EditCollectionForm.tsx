import { useCallback } from 'react'

import {
  AlbumSchema,
  AlbumValues,
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
import { AccessAndSaleField } from '../fields/AccessAndSaleField'
import { CollectionTrackFieldArray } from '../fields/CollectionTrackFieldArray'
import { ReleaseDateFieldLegacy } from '../fields/ReleaseDateFieldLegacy'
import { SelectGenreField } from '../fields/SelectGenreField'
import { SelectMoodField } from '../fields/SelectMoodField'
import { AccessAndSaleFormValues } from '../fields/types'
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
  const isAlbum = uploadType === UploadType.ALBUM

  const initialValues: CollectionValues = {
    ...metadata,
    is_album: isAlbum,
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

  // TODO: fix the types here
  const populateAlbumTrackPrice = (values: AlbumValues) => {
    const albumTrackPrice =
      values?.stream_conditions?.usdc_purchase?.albumTrackPrice
    const trackStreamConditions = {
      usdc_purchase: {
        price: albumTrackPrice
      }
    }
    for (const track of values.tracks) {
      track.metadata = {
        ...track.metadata,
        preview_start_seconds: 0,
        is_stream_gated: true,
        stream_conditions: trackStreamConditions
      }
    }
  }

  const handleSubmit = useCallback(
    (values: CollectionValues) => {
      // TODO: check for price existing at all
      if (isAlbum) {
        populateAlbumTrackPrice(values)
      }

      console.log('EditCollectionForm submit', { values })
      // console.log('Refined values', { valuesWithTrackPrices })
      onContinue({
        uploadType,
        tracks: values.tracks,
        metadata: values
      })
    },
    [isAlbum, onContinue, uploadType]
  )

  const collectionTypeName =
    uploadType === UploadType.ALBUM ? 'Album' : 'Playlist'

  const validationSchema =
    uploadType === UploadType.ALBUM ? AlbumSchema : PlaylistSchema

  const handleAccessAndSaleSubmit = (values: AccessAndSaleFormValues) => {
    console.log('Values from submit: ', { values })
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
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
                aria-label={`${collectionTypeName} ${messages.description}`}
                placeholder={`${collectionTypeName} ${messages.description}`}
                maxLength={1000}
                showMaxLength
                className={styles.description}
                grows
              />
            </div>
          </div>
          <ReleaseDateFieldLegacy />
          {isAlbum ? (
            <AccessAndSaleField
              isAlbum
              isUpload
              onSubmit={handleAccessAndSaleSubmit}
            />
          ) : null}
          <div className={styles.trackDetails}>
            <Text variant='label'>{messages.trackDetails.title}</Text>
            <Text variant='body'>{messages.trackDetails.description}</Text>
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
