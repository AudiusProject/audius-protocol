import { useCallback, useMemo } from 'react'

import { USDCPurchaseConfig, useUSDCPurchaseConfig } from '@audius/common/hooks'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  FieldVisibility,
  StreamTrackAvailabilityType,
  CollectibleGatedConditions,
  FollowGatedConditions,
  TipGatedConditions,
  USDCPurchaseConditions
} from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { formatPrice } from '@audius/common/utils'
import {
  IconCart,
  IconCollectible,
  IconVisibilityHidden as IconHidden,
  IconNote,
  IconSpecialAccess,
  IconVisibilityPublic,
  Text
} from '@audius/harmony'
import { useField } from 'formik'
import { get, isEmpty, set } from 'lodash'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { defaultFieldVisibility } from 'pages/track-page/utils'

import { useIndexedField, useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import styles from './AccessAndSaleField.module.css'
import { AccessAndSaleMenuFields } from './AccessAndSaleMenuFields'
import { REMIX_OF } from './RemixSettingsField'
import { getCombinedDefaultGatedConditionValues } from './helpers'
import {
  AccessAndSaleFormValues,
  DOWNLOAD_CONDITIONS,
  DOWNLOAD_REQUIRES_FOLLOW,
  FIELD_VISIBILITY,
  GateKeeper,
  IS_DOWNLOADABLE,
  IS_DOWNLOAD_GATED,
  IS_SCHEDULED_RELEASE,
  IS_STREAM_GATED,
  IS_UNLISTED,
  LAST_GATE_KEEPER,
  PREVIEW,
  PRICE,
  PRICE_HUMANIZED,
  SPECIAL_ACCESS_TYPE,
  STREAM_AVAILABILITY_TYPE,
  STREAM_CONDITIONS,
  SpecialAccessType
} from './types'

const { getUserId } = accountSelectors

const messages = {
  title: 'Access & Sale',
  description:
    "Customize your music's availability for different audiences, and create personalized gated experiences for your fans.",
  public: 'Public (Free to Stream)',
  specialAccess: 'Special Access',
  collectibleGated: 'Collectible Gated',
  hidden: 'Hidden',
  fieldVisibility: {
    genre: 'Show Genre',
    mood: 'Show Mood',
    tags: 'Show Tags',
    share: 'Show Share Button',
    play_count: 'Show Play Count',
    remixes: 'Show Remixes'
  },
  followersOnly: 'Followers Only',
  supportersOnly: 'Supporters Only',
  ownersOf: 'Owners Of',
  price: (price: number) =>
    price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
  preview: (seconds: number) => {
    return `${seconds.toString()} seconds`
  },
  errors: {
    price: {
      tooLow: (minPrice: number) =>
        `Price must be at least $${formatPrice(minPrice)}.`,
      tooHigh: (maxPrice: number) =>
        `Price must be less than $${formatPrice(maxPrice)}.`
    },
    preview: {
      tooEarly: 'Preview must start during the track.',
      tooLate:
        'Preview must start at least 30 seconds before the end of the track.'
    }
  },
  required: 'Required'
}

export type USDCPurchaseRemoteConfig = Pick<
  USDCPurchaseConfig,
  'minContentPriceCents' | 'maxContentPriceCents'
>

export const AccessAndSaleFormSchema = (
  trackLength: number,
  { minContentPriceCents, maxContentPriceCents }: USDCPurchaseRemoteConfig
) =>
  z
    .object({
      [STREAM_CONDITIONS]: z.any(),
      [PREVIEW]: z.optional(
        z.nullable(z.number({ invalid_type_error: messages.required }))
      ),
      [STREAM_AVAILABILITY_TYPE]: z.nativeEnum(StreamTrackAvailabilityType)
    })
    .refine(
      (values) => {
        const formValues = values as AccessAndSaleFormValues
        const streamConditions = formValues[STREAM_CONDITIONS]
        if (
          formValues[STREAM_AVAILABILITY_TYPE] === 'USDC_PURCHASE' &&
          isContentUSDCPurchaseGated(streamConditions)
        ) {
          const { price } = streamConditions.usdc_purchase
          return price > 0 && price >= minContentPriceCents
        }
        return true
      },
      {
        message: messages.errors.price.tooLow(minContentPriceCents),
        path: [PRICE]
      }
    )
    .refine(
      (values) => {
        const formValues = values as AccessAndSaleFormValues
        const streamConditions = formValues[STREAM_CONDITIONS]
        if (
          formValues[STREAM_AVAILABILITY_TYPE] === 'USDC_PURCHASE' &&
          isContentUSDCPurchaseGated(streamConditions)
        ) {
          return streamConditions.usdc_purchase.price <= maxContentPriceCents
        }
        return true
      },
      {
        message: messages.errors.price.tooHigh(maxContentPriceCents),
        path: [PRICE]
      }
    )
    .refine(
      (values) => {
        const formValues = values as AccessAndSaleFormValues
        if (formValues[STREAM_AVAILABILITY_TYPE] === 'USDC_PURCHASE') {
          return formValues[PREVIEW] !== undefined && formValues[PREVIEW] >= 0
        }
        return true
      },
      { message: messages.errors.preview.tooEarly, path: [PREVIEW] }
    )
    .refine(
      (values) => {
        const formValues = values as AccessAndSaleFormValues
        if (formValues[STREAM_AVAILABILITY_TYPE] === 'USDC_PURCHASE') {
          return (
            formValues[PREVIEW] === undefined ||
            isNaN(trackLength) ||
            (formValues[PREVIEW] >= 0 &&
              formValues[PREVIEW] < trackLength - 30) ||
            (trackLength <= 30 && formValues[PREVIEW] < trackLength)
          )
        }
        return true
      },
      { message: messages.errors.preview.tooLate, path: [PREVIEW] }
    )

type AccessAndSaleFieldProps = {
  isUpload?: boolean
  trackLength?: number
  forceOpen?: boolean
  setForceOpen?: (value: boolean) => void
}

export const AccessAndSaleField = (props: AccessAndSaleFieldProps) => {
  const { isUpload, forceOpen, setForceOpen } = props

  const [{ value: index }] = useField('trackMetadatasIndex')
  const [{ value: trackLength }] = useIndexedField<number>(
    'tracks',
    index,
    'preview.duration'
  )

  const usdcPurchaseConfig = useUSDCPurchaseConfig()

  // Fields from the outer form
  const [{ value: isUnlisted }, , { setValue: setIsUnlistedValue }] =
    useTrackField<SingleTrackEditValues[typeof IS_UNLISTED]>(IS_UNLISTED)
  const [{ value: isScheduledRelease }, ,] =
    useTrackField<SingleTrackEditValues[typeof IS_SCHEDULED_RELEASE]>(
      IS_SCHEDULED_RELEASE
    )
  const [{ value: isStreamGated }, , { setValue: setIsStreamGated }] =
    useTrackField<SingleTrackEditValues[typeof IS_STREAM_GATED]>(
      IS_STREAM_GATED
    )
  const [
    { value: savedStreamConditions },
    ,
    { setValue: setStreamConditionsValue }
  ] =
    useTrackField<SingleTrackEditValues[typeof STREAM_CONDITIONS]>(
      STREAM_CONDITIONS
    )
  const [{ value: fieldVisibility }, , { setValue: setFieldVisibilityValue }] =
    useTrackField<SingleTrackEditValues[typeof FIELD_VISIBILITY]>(
      FIELD_VISIBILITY
    )
  const [{ value: remixOfValue }] =
    useTrackField<SingleTrackEditValues[typeof REMIX_OF]>(REMIX_OF)

  const [{ value: preview }, , { setValue: setPreviewValue }] =
    useTrackField<SingleTrackEditValues[typeof PREVIEW]>(PREVIEW)

  const [{ value: isDownloadGated }, , { setValue: setIsDownloadGated }] =
    useTrackField<SingleTrackEditValues[typeof IS_DOWNLOAD_GATED]>(
      IS_DOWNLOAD_GATED
    )
  const [
    { value: downloadConditions },
    ,
    { setValue: setDownloadConditionsValue }
  ] =
    useTrackField<SingleTrackEditValues[typeof DOWNLOAD_CONDITIONS]>(
      DOWNLOAD_CONDITIONS
    )
  const [{ value: isDownloadable }, , { setValue: setIsDownloadable }] =
    useTrackField<boolean>(IS_DOWNLOADABLE)
  const [
    { value: downloadRequiresFollow },
    ,
    { setValue: setDownloadRequiresFollow }
  ] = useTrackField<boolean>(DOWNLOAD_REQUIRES_FOLLOW)
  const [{ value: lastGateKeeper }, , { setValue: setLastGateKeeper }] =
    useTrackField<GateKeeper>(LAST_GATE_KEEPER)

  const isRemix = !isEmpty(remixOfValue?.tracks)

  /**
   * Stream conditions from inside the modal.
   * Upon submit, these values along with the selected access option will
   * determine the final stream conditions that get saved to the track.
   */
  const accountUserId = useSelector(getUserId)
  const tempStreamConditions = useMemo(
    () => ({
      ...getCombinedDefaultGatedConditionValues(accountUserId),
      ...savedStreamConditions
    }),
    [accountUserId, savedStreamConditions]
  )

  const initialValues = useMemo(() => {
    const isUsdcGated = isContentUSDCPurchaseGated(savedStreamConditions)
    const isTipGated = isContentTipGated(savedStreamConditions)
    const isFollowGated = isContentFollowGated(savedStreamConditions)
    const isCollectibleGated = isContentCollectibleGated(savedStreamConditions)

    const initialValues = {}
    set(initialValues, IS_UNLISTED, isUnlisted)
    set(initialValues, IS_STREAM_GATED, isStreamGated)
    set(initialValues, STREAM_CONDITIONS, tempStreamConditions)
    set(initialValues, IS_DOWNLOAD_GATED, isDownloadGated)
    set(initialValues, DOWNLOAD_CONDITIONS, downloadConditions)
    set(initialValues, IS_DOWNLOADABLE, isDownloadable)
    set(initialValues, DOWNLOAD_REQUIRES_FOLLOW, downloadRequiresFollow)
    set(initialValues, LAST_GATE_KEEPER, lastGateKeeper ?? {})

    let availabilityType = StreamTrackAvailabilityType.PUBLIC
    if (isUsdcGated) {
      availabilityType = StreamTrackAvailabilityType.USDC_PURCHASE
      set(
        initialValues,
        PRICE_HUMANIZED,
        tempStreamConditions.usdc_purchase.price
          ? (Number(tempStreamConditions.usdc_purchase.price) / 100).toFixed(2)
          : undefined
      )
    }
    if (isFollowGated || isTipGated) {
      availabilityType = StreamTrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isCollectibleGated) {
      availabilityType = StreamTrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (isUnlisted && !isScheduledRelease) {
      availabilityType = StreamTrackAvailabilityType.HIDDEN
    }
    set(initialValues, STREAM_AVAILABILITY_TYPE, availabilityType)
    set(initialValues, FIELD_VISIBILITY, fieldVisibility)
    set(initialValues, PREVIEW, preview)
    set(
      initialValues,
      SPECIAL_ACCESS_TYPE,
      isTipGated ? SpecialAccessType.TIP : SpecialAccessType.FOLLOW
    )
    return initialValues as AccessAndSaleFormValues
  }, [
    savedStreamConditions,
    isUnlisted,
    isStreamGated,
    tempStreamConditions,
    isDownloadGated,
    downloadConditions,
    isDownloadable,
    downloadRequiresFollow,
    fieldVisibility,
    preview,
    isScheduledRelease,
    lastGateKeeper
  ])

  const handleSubmit = useCallback(
    (values: AccessAndSaleFormValues) => {
      const availabilityType = get(values, STREAM_AVAILABILITY_TYPE)
      const preview = get(values, PREVIEW)
      const specialAccessType = get(values, SPECIAL_ACCESS_TYPE)
      const fieldVisibility = get(values, FIELD_VISIBILITY)
      const streamConditions = get(values, STREAM_CONDITIONS)
      const lastGateKeeper = get(values, LAST_GATE_KEEPER)

      setFieldVisibilityValue({
        ...defaultFieldVisibility,
        remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
      })
      setIsUnlistedValue(isUnlisted)
      setIsStreamGated(false)
      setStreamConditionsValue(null)
      setPreviewValue(undefined)

      // For gated options, extract the correct stream conditions based on the selected availability type
      switch (availabilityType) {
        case StreamTrackAvailabilityType.USDC_PURCHASE: {
          // type cast because the object is fully formed in saga (validated + added splits)
          const conditions = {
            usdc_purchase: {
              price: Math.round(
                (streamConditions as USDCPurchaseConditions).usdc_purchase.price
              )
            }
          } as USDCPurchaseConditions
          setIsStreamGated(true)
          setStreamConditionsValue(conditions)
          setPreviewValue(preview ?? 0)
          setIsDownloadGated(true)
          setDownloadConditionsValue(conditions)
          setIsDownloadable(true)
          setDownloadRequiresFollow(false)
          const downloadableGateKeeper =
            isDownloadable &&
            lastGateKeeper.downloadable === 'stemsAndDownloads'
              ? 'stemsAndDownloads'
              : 'accessAndSale'
          setLastGateKeeper({
            ...lastGateKeeper,
            access: 'accessAndSale',
            downloadable: downloadableGateKeeper
          })
          break
        }
        case StreamTrackAvailabilityType.SPECIAL_ACCESS: {
          if (specialAccessType === SpecialAccessType.FOLLOW) {
            const { follow_user_id } = streamConditions as FollowGatedConditions
            setStreamConditionsValue({ follow_user_id })
            setDownloadConditionsValue({ follow_user_id })
            if (isDownloadable) {
              setDownloadRequiresFollow(true)
            }
          } else {
            const { tip_user_id } = streamConditions as TipGatedConditions
            setStreamConditionsValue({ tip_user_id })
            setDownloadConditionsValue({ tip_user_id })
            if (isDownloadable) {
              setDownloadRequiresFollow(false)
            }
          }
          setIsStreamGated(true)
          setIsDownloadGated(true)
          setLastGateKeeper({
            ...lastGateKeeper,
            access: 'accessAndSale'
          })
          break
        }
        case StreamTrackAvailabilityType.COLLECTIBLE_GATED: {
          const { nft_collection } =
            streamConditions as CollectibleGatedConditions
          setIsStreamGated(true)
          setStreamConditionsValue({ nft_collection })
          setIsDownloadGated(true)
          setDownloadConditionsValue({ nft_collection })
          if (isDownloadable) {
            setDownloadRequiresFollow(false)
          }
          setLastGateKeeper({
            ...lastGateKeeper,
            access: 'accessAndSale'
          })
          break
        }
        case StreamTrackAvailabilityType.HIDDEN: {
          setFieldVisibilityValue({
            ...(fieldVisibility ?? undefined),
            remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
          })
          setIsUnlistedValue(true)
          if (lastGateKeeper.access === 'accessAndSale') {
            setIsDownloadGated(false)
            setDownloadConditionsValue(null)
          }
          if (lastGateKeeper.downloadable === 'accessAndSale') {
            setIsDownloadable(false)
          }
          break
        }
        case StreamTrackAvailabilityType.PUBLIC: {
          setIsUnlistedValue(false)
          if (lastGateKeeper.access === 'accessAndSale') {
            setIsDownloadGated(false)
            setDownloadConditionsValue(null)
          }
          if (lastGateKeeper.downloadable === 'accessAndSale') {
            setIsDownloadable(false)
          }
          break
        }
      }
    },
    [
      setFieldVisibilityValue,
      setIsStreamGated,
      setIsUnlistedValue,
      setStreamConditionsValue,
      setIsDownloadGated,
      setDownloadConditionsValue,
      setIsDownloadable,
      setDownloadRequiresFollow,
      setPreviewValue,
      setLastGateKeeper,
      isDownloadable,
      isUnlisted
    ]
  )

  const renderValue = useCallback(() => {
    if (isContentCollectibleGated(savedStreamConditions)) {
      const { nft_collection } = savedStreamConditions
      if (!nft_collection) return null
      const { imageUrl, name } = nft_collection

      return (
        <>
          <SelectedValue
            label={messages.collectibleGated}
            icon={IconCollectible}
          />
          <div className={styles.nftOwner}>
            <Text variant='label' size='small'>
              {messages.ownersOf}:
            </Text>
            <SelectedValue>
              {imageUrl ? (
                <DynamicImage
                  wrapperClassName={styles.nftArtwork}
                  image={imageUrl}
                />
              ) : null}
              <Text variant='body' strength='strong'>
                {name}
              </Text>
            </SelectedValue>
          </div>
        </>
      )
    }

    let selectedValues = []

    const specialAccessValue = {
      label: messages.specialAccess,
      icon: IconSpecialAccess
    }

    if (isContentUSDCPurchaseGated(savedStreamConditions)) {
      selectedValues = [
        {
          label: messages.price(
            savedStreamConditions.usdc_purchase.price / 100
          ),
          icon: IconCart
        }
      ]
      if (preview) {
        selectedValues.push({
          label: messages.preview(preview),
          icon: IconNote
        })
      }
    } else if (isContentFollowGated(savedStreamConditions)) {
      selectedValues = [specialAccessValue, messages.followersOnly]
    } else if (isContentTipGated(savedStreamConditions)) {
      selectedValues = [specialAccessValue, messages.supportersOnly]
    } else if (isUnlisted && !isScheduledRelease && fieldVisibility) {
      const fieldVisibilityKeys = Object.keys(
        messages.fieldVisibility
      ) as Array<keyof FieldVisibility>

      const fieldVisibilityLabels = fieldVisibilityKeys
        .filter((visibilityKey) => fieldVisibility[visibilityKey])
        .map((visibilityKey) => messages.fieldVisibility[visibilityKey])
      selectedValues = [
        { label: messages.hidden, icon: IconHidden },
        ...fieldVisibilityLabels
      ]
    } else {
      selectedValues = [{ label: messages.public, icon: IconVisibilityPublic }]
    }

    return (
      <div className={styles.value}>
        {selectedValues.map((value) => {
          const valueProps =
            typeof value === 'string' ? { label: value } : value
          return <SelectedValue key={valueProps.label} {...valueProps} />
        })}
      </div>
    )
  }, [
    fieldVisibility,
    isUnlisted,
    savedStreamConditions,
    preview,
    isScheduledRelease
  ])

  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconHidden />}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      renderValue={renderValue}
      validationSchema={toFormikValidationSchema(
        AccessAndSaleFormSchema(trackLength, usdcPurchaseConfig)
      )}
      menuFields={
        <AccessAndSaleMenuFields
          isRemix={isRemix}
          isUpload={isUpload}
          streamConditions={tempStreamConditions}
          isScheduledRelease={isScheduledRelease}
        />
      }
      forceOpen={forceOpen}
      setForceOpen={setForceOpen}
    />
  )
}
