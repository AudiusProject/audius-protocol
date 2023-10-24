import { useCallback, useMemo } from 'react'

import type { UploadTrack } from '@audius/common'
import {
  creativeCommons,
  formatPrice,
  useUSDCPurchaseConfig
} from '@audius/common'
import { Formik } from 'formik'
import * as Yup from 'yup'

import { useRemoteVar } from 'app/hooks/useRemoteConfig'

import { EditTrackNavigator } from './EditTrackNavigator'
import type { FormValues, EditTrackScreenProps } from './types'
const { computeLicenseVariables, ALL_RIGHTS_RESERVED_TYPE } = creativeCommons

const useEditTrackSchema = () => {
  const { minContentPriceCents, maxContentPriceCents } =
    useUSDCPurchaseConfig(useRemoteVar)
  return useMemo(
    () =>
      Yup.object().shape({
        title: Yup.string().required('Your track must have a name.'),
        artwork: Yup.object({
          url: Yup.string()
        })
          .when('trackArtwork', {
            is: undefined,
            then: Yup.object().required('Artwork is required.').nullable()
          })
          .nullable(),
        trackArtwork: Yup.string().nullable(),
        genre: Yup.string().required('Genre is required.'),
        description: Yup.string().max(1000).nullable(),
        premium_conditions: Yup.object({
          usdc_purchase: Yup.object({
            price: Yup.number()
              .typeError('Required')
              .positive()
              .min(
                minContentPriceCents / 100,
                `Price must be at least $${formatPrice(minContentPriceCents)}.`
              )
              .max(
                maxContentPriceCents / 100,
                `Price must be less than $${formatPrice(maxContentPriceCents)}.`
              )
          }).nullable()
        }).nullable(),
        duration: Yup.number().nullable(),
        preview_start_seconds: Yup.number()
          .test('isValidPreviewStart', '', function (value: number) {
            const duration = this.resolve(
              Yup.ref('duration')
            ) as unknown as number
            // If duration is NaN, validation passes because we were
            // unable to get duration from a track
            if (isNaN(duration) || duration === null) return true
            if (duration > 30 && value > duration - 30) {
              return this.createError({
                message:
                  'Preview must start at least 30 seconds before the end of the track.'
              })
            }
            if (duration <= 30 && value !== 0) {
              return this.createError({
                message:
                  'Preview must start at 0 since the track is less than 30 seconds.'
              })
            }
            return true
          })
          .nullable()
      }),
    [minContentPriceCents, maxContentPriceCents]
  )
}

export type EditTrackParams = UploadTrack

export const EditTrackScreen = (props: EditTrackScreenProps) => {
  const { initialValues: initialValuesProp, onSubmit, ...screenProps } = props
  const editTrackSchema = useEditTrackSchema()

  const initialValues: FormValues = {
    ...initialValuesProp,
    licenseType: computeLicenseVariables(
      initialValuesProp.license || ALL_RIGHTS_RESERVED_TYPE
    )
  }

  const handleSubmit = useCallback(
    (values: FormValues) => {
      const {
        licenseType: ignoredLicenseType,
        trackArtwork: ignoredTrackArtwork,
        ...metadata
      } = values

      // If track is not unlisted and one of the unlisted visibility fields is false, set to true.
      // We shouldn't have to do this if we set the default for 'share' and 'play_count' to true
      // in newTrackMetadata, but not sure why they default to false.
      if (!metadata.is_unlisted) {
        const unlistedVisibilityFields = [
          'genre',
          'mood',
          'tags',
          'share',
          'play_count'
        ]
        const shouldOverrideVisibilityFields = !unlistedVisibilityFields.every(
          (field) => metadata.field_visibility?.[field]
        )
        if (shouldOverrideVisibilityFields) {
          metadata.field_visibility = {
            ...metadata.field_visibility,
            genre: true,
            mood: true,
            tags: true,
            share: true,
            play_count: true,
            remixes: !!metadata.field_visibility?.remixes
          }
        }
      }
      onSubmit(metadata)
    },
    [onSubmit]
  )

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={editTrackSchema}
    >
      {(formikProps) => (
        <EditTrackNavigator {...formikProps} {...screenProps} />
      )}
    </Formik>
  )
}
