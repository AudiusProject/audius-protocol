import { useCallback, useMemo } from 'react'

import { useUSDCPurchaseConfig } from '@audius/common/hooks'
import { isContentUSDCPurchaseGated } from '@audius/common/models'
import type { UploadTrack } from '@audius/common/store'
import { creativeCommons, formatPrice } from '@audius/common/utils'
import { Formik } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { EditTrackNavigator } from './EditTrackNavigator'
import { TRACK_PREVIEW } from './fields/AccessAndSaleField/PremiumRadioField/TrackPreviewField'
import { TRACK_PRICE } from './fields/AccessAndSaleField/PremiumRadioField/TrackPriceField'
import type { FormValues, EditTrackScreenProps } from './types'
const { computeLicenseVariables, ALL_RIGHTS_RESERVED_TYPE } = creativeCommons

const errorMessages = {
  title: 'Your track must have a name',
  genre: 'Genre is required',
  artwork: 'Artwork is required',
  description: 'Description cannot exceed 1000 characters',
  previewStartThirtyBeforeEnd:
    'Preview must start at least 30 seconds before the end of the track.',
  previewStartZero:
    'Preview must start at 0 since the track is less than 30 seconds.'
}

const useEditTrackSchema = () => {
  const { minContentPriceCents, maxContentPriceCents } = useUSDCPurchaseConfig()
  return useMemo(
    /**
     * The refine functions only get executed if the original object definition (before refine) validation passes.
     * This means that if one of the fields is invalid in the original object definition, while there are other fields
     * that are invalid but would only trigger the error in the refine functions, we would only see the first error.
     * We want all errors to surface at once, so I'm using the refine functions to do the validations.
     * I understand this is somewhat antithetical to the purpose of the zod types in the first place, but unless
     * we are okay with occasionally showing one error at a time, we will have to do it this way.
     */
    () =>
      z
        .object({
          artwork: z
            .object({
              url: z.string()
            })
            .nullable(),
          trackArtwork: z.string().nullish(),
          title: z.string(),
          genre: z.any(),
          description: z.string().nullish(),
          stream_conditions: z.any(),
          duration: z.number().nullable(),
          preview_start_seconds: z.any()
        })
        .refine(
          (values) => {
            const { artwork, trackArtwork } = values
            return (
              trackArtwork !== undefined ||
              (artwork !== null && typeof artwork === 'object')
            )
          },
          { message: errorMessages.artwork, path: ['artwork'] }
        )
        .refine(
          (values) => {
            return !!values.title
          },
          { message: errorMessages.title, path: ['title'] }
        )
        .refine(
          (values) => {
            return typeof values.genre === 'string' && !!values.genre
          },
          { message: errorMessages.description, path: ['genre'] }
        )
        .refine(
          (values) => {
            return !values.description || values.description.length <= 1000
          },
          { message: errorMessages.description, path: ['description'] }
        )
        .refine(
          (values) => {
            const { stream_conditions: streamConditions } = values
            if (isContentUSDCPurchaseGated(streamConditions)) {
              const { price } = streamConditions.usdc_purchase
              return price > 0 && price >= minContentPriceCents / 100
            }
            return true
          },
          {
            message: `Price must be at least $${formatPrice(
              minContentPriceCents
            )}.`,
            path: [TRACK_PRICE]
          }
        )
        .refine(
          (values) => {
            const { stream_conditions: streamConditions } = values
            if (isContentUSDCPurchaseGated(streamConditions)) {
              return (
                streamConditions.usdc_purchase.price <=
                maxContentPriceCents / 100
              )
            }
            return true
          },
          {
            message: `Price must be less than $${formatPrice(
              maxContentPriceCents
            )}.`,
            path: [TRACK_PRICE]
          }
        )
        .refine(
          (values) => {
            const {
              duration,
              stream_conditions: streamConditions,
              preview_start_seconds: previewStartSeconds
            } = values
            // We only care about preview if track is usdc gated
            if (
              previewStartSeconds === null &&
              !isContentUSDCPurchaseGated(streamConditions)
            )
              return true
            if (
              previewStartSeconds !== null &&
              !isContentUSDCPurchaseGated(streamConditions)
            )
              return false

            // If preview is falsy and track is usdc gated (because we got to this line),
            // validation passes because we will simply set it to 0
            if (!previewStartSeconds) return true

            // If duration is NaN, validation passes because we were unable to get duration from a track
            if (duration === null || isNaN(duration)) return true

            return (
              duration <= 30 || Number(previewStartSeconds) <= duration - 30
            )
          },
          {
            message: errorMessages.previewStartThirtyBeforeEnd,
            path: [TRACK_PREVIEW]
          }
        )
        .refine(
          (values) => {
            const { duration, preview_start_seconds: previewStartSeconds } =
              values
            return (
              duration === null ||
              previewStartSeconds === null ||
              duration! > 30 ||
              Number(previewStartSeconds) === 0
            )
          },
          {
            message: errorMessages.previewStartZero,
            path: [TRACK_PREVIEW]
          }
        ),
    [minContentPriceCents, maxContentPriceCents]
  )
}

const PRECISION = 2

export type EditTrackParams = UploadTrack

export const EditTrackScreen = (props: EditTrackScreenProps) => {
  const editTrackSchema = toFormikValidationSchema(useEditTrackSchema())

  const { initialValues: initialValuesProp, onSubmit, ...screenProps } = props

  // Handle price conversion of usdc gated tracks from cents => dollars on edit.
  // Convert back to cents on submit function below.
  const streamConditionsOverride = isContentUSDCPurchaseGated(
    initialValuesProp.stream_conditions
  )
    ? {
        usdc_purchase: {
          ...initialValuesProp.stream_conditions.usdc_purchase,
          price:
            initialValuesProp.stream_conditions.usdc_purchase.price /
            10 ** PRECISION
        }
      }
    : initialValuesProp.stream_conditions
  const initialValues: FormValues = {
    ...initialValuesProp,
    stream_conditions: streamConditionsOverride,
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

      // If track is usdc gated, then price and preview need to be parsed into numbers before submitting
      if (isContentUSDCPurchaseGated(metadata.stream_conditions)) {
        metadata.stream_conditions = {
          usdc_purchase: {
            ...metadata.stream_conditions.usdc_purchase,
            // Convert dollar price to cents
            // @ts-ignore the price input field stored it as a string that needs to be parsed into a number
            price:
              Number(metadata.stream_conditions.usdc_purchase.price) *
              10 ** PRECISION
          }
        }
        // If user did not set usdc gated track preview, default it to 0
        metadata.preview_start_seconds = Number(
          metadata.preview_start_seconds ?? 0
        )
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
