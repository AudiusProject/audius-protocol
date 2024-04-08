import { useCallback } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import {
  AlbumSchema,
  CollectionValues,
  PlaylistSchema
} from '@audius/common/schemas'
import { FeatureFlags } from '@audius/common/services'
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
import { AccessAndSaleField } from '../fields/AccessAndSaleField'
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
    description: 'Set defaults for all tracks in this collection'
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
  const isAlbum = uploadType === UploadType.ALBUM
  const { isEnabled: isPremiumAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )
  const { isEnabled: isUSDCUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )
  const showPremiumAlbums = isPremiumAlbumsEnabled && isUSDCUploadEnabled

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
          {isAlbum && showPremiumAlbums ? (
            <AccessAndSaleField isAlbum isUpload />
          ) : null}
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
