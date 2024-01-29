import { useCallback, useMemo } from 'react'

import {
  accountSelectors,
  FeatureFlags,
  FieldVisibility,
  formatPrice,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  Nullable,
  TrackAvailabilityType,
  USDCPurchaseConfig,
  useUSDCPurchaseConfig,
  useAccessAndRemixSettings,
  CollectibleGatedConditions,
  USDCPurchaseConditions,
  FollowGatedConditions,
  TipGatedConditions,
  ID,
  useFeatureFlag,
  AccessConditions
} from '@audius/common'
import {
  IconCart,
  IconCollectible,
  IconHidden,
  IconNote,
  IconSpecialAccess,
  IconVisibilityPublic,
  RadioButtonGroup
} from '@audius/stems'
import cn from 'classnames'
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
import { HelpCallout } from 'components/help-callout/HelpCallout'
import layoutStyles from 'components/layout/layout.module.css'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { Text } from 'components/typography'
import { useFlag } from 'hooks/useRemoteConfig'
import { defaultFieldVisibility } from 'pages/track-page/utils'

import { HiddenAvailabilityFields } from '../fields/availability/HiddenAvailabilityFields'
import { SpecialAccessFields } from '../fields/availability/SpecialAccessFields'
import { useIndexedField, useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import styles from './AccessAndSaleField.module.css'
import { REMIX_OF } from './RemixSettingsField'
import { CollectibleGatedRadioField } from './availability/collectible-gated/CollectibleGatedRadioField'
import { UsdcPurchaseGatedRadioField } from './availability/usdc-purchase-gated/UsdcPurchaseGatedRadioField'
import {
  PREVIEW,
  AVAILABILITY_TYPE,
  AccessAndSaleFormValues,
  PRICE,
  IS_UNLISTED,
  FIELD_VISIBILITY,
  PRICE_HUMANIZED,
  SPECIAL_ACCESS_TYPE,
  SpecialAccessType
} from './types'
const { getUserId } = accountSelectors

const messages = {
  title: 'Access & Sale',
  description:
    "Customize your music's availability for different audiences, and create personalized gated experiences for your fans.",
  modalDescription:
    'Control who has access to listen. Create gated experiences or require users pay to unlock your music.',
  isRemix:
    'This track is marked as a remix. To enable additional availability options, unmark within Remix Settings.',
  done: 'Done',
  public: 'Public (Free to Stream)',
  publicSubtitle:
    'Public tracks are visible to all users and appear throughout Audius.',
  specialAccess: 'Special Access',
  specialAccessSubtitle:
    'Special Access tracks are only available to users who meet certain criteria, such as following the artist.',
  collectibleGated: 'Collectible Gated',
  compatibilityTitle: "Not seeing what you're looking for?",
  compatibilitySubtitle:
    'Unverified Solana NFT Collections are not compatible at this time.',
  hidden: 'Hidden',
  hiddenSubtitle:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  hiddenHint: 'Scheduled tracks are hidden by default until release.',
  learnMore: 'Learn More',
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

type AccessAndSaleRemoteConfig = Pick<
  USDCPurchaseConfig,
  'minContentPriceCents' | 'maxContentPriceCents'
>

export const AccessAndSaleFormSchema = (
  trackLength: number,
  { minContentPriceCents, maxContentPriceCents }: AccessAndSaleRemoteConfig
) =>
  z
    .object({
      [STREAM_CONDITIONS]: z.any(),
      [PREVIEW]: z.optional(
        z.nullable(z.number({ invalid_type_error: messages.required }))
      ),
      [AVAILABILITY_TYPE]: z.nativeEnum(TrackAvailabilityType)
    })
    .refine(
      (values) => {
        const formValues = values as AccessAndSaleFormValues
        const streamConditions = formValues[STREAM_CONDITIONS]
        if (
          formValues[AVAILABILITY_TYPE] === 'USDC_PURCHASE' &&
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
          formValues[AVAILABILITY_TYPE] === 'USDC_PURCHASE' &&
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
        if (formValues[AVAILABILITY_TYPE] === 'USDC_PURCHASE') {
          return formValues[PREVIEW] !== undefined && formValues[PREVIEW] >= 0
        }
        return true
      },
      { message: messages.errors.preview.tooEarly, path: [PREVIEW] }
    )
    .refine(
      (values) => {
        const formValues = values as AccessAndSaleFormValues
        if (formValues[AVAILABILITY_TYPE] === 'USDC_PURCHASE') {
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

/**
 * Allows us to store all the user selections in the Access & Sale modal
 * so that their previous selections is remembered as they change between the radio button options.
 * On submit (saving the changes in the Access & Sale modal), we only save the corresponding
 * stream conditions based on the availability type they have currently selected.
 */
export const getCombinedDefaultGatedConditionValues = (
  userId: Nullable<ID>
) => ({
  usdc_purchase: { price: null },
  follow_user_id: userId,
  tip_user_id: userId,
  nft_collection: undefined
})

type AccessAndSaleFieldProps = {
  isUpload?: boolean
  trackLength?: number
}

export const AccessAndSaleField = (props: AccessAndSaleFieldProps) => {
  const { isUpload } = props

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

    let availabilityType = TrackAvailabilityType.PUBLIC
    if (isUsdcGated) {
      availabilityType = TrackAvailabilityType.USDC_PURCHASE
      set(
        initialValues,
        PRICE_HUMANIZED,
        tempStreamConditions.usdc_purchase.price
          ? (Number(tempStreamConditions.usdc_purchase.price) / 100).toFixed(2)
          : undefined
      )
    }
    if (isFollowGated || isTipGated) {
      availabilityType = TrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isCollectibleGated) {
      availabilityType = TrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (isUnlisted && !isScheduledRelease) {
      availabilityType = TrackAvailabilityType.HIDDEN
    }
    set(initialValues, AVAILABILITY_TYPE, availabilityType)
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
    fieldVisibility,
    preview,
    isScheduledRelease
  ])

  const handleSubmit = useCallback(
    (values: AccessAndSaleFormValues) => {
      const availabilityType = get(values, AVAILABILITY_TYPE)
      const preview = get(values, PREVIEW)
      const specialAccessType = get(values, SPECIAL_ACCESS_TYPE)
      const fieldVisibility = get(values, FIELD_VISIBILITY)
      const streamConditions = get(values, STREAM_CONDITIONS)

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
        case TrackAvailabilityType.USDC_PURCHASE: {
          setPreviewValue(preview ?? 0)
          const {
            usdc_purchase: { price }
          } = streamConditions as USDCPurchaseConditions
          setStreamConditionsValue({
            // @ts-ignore fully formed in saga (validated + added splits)
            usdc_purchase: { price: Math.round(price) }
          })
          setIsStreamGated(true)
          break
        }
        case TrackAvailabilityType.SPECIAL_ACCESS: {
          if (specialAccessType === SpecialAccessType.FOLLOW) {
            const { follow_user_id } = streamConditions as FollowGatedConditions
            setStreamConditionsValue({ follow_user_id })
          } else {
            const { tip_user_id } = streamConditions as TipGatedConditions
            setStreamConditionsValue({ tip_user_id })
          }
          setIsStreamGated(true)
          break
        }
        case TrackAvailabilityType.COLLECTIBLE_GATED: {
          const { nft_collection } =
            streamConditions as CollectibleGatedConditions
          setStreamConditionsValue({ nft_collection })
          setIsStreamGated(true)
          break
        }
        case TrackAvailabilityType.HIDDEN: {
          setFieldVisibilityValue({
            ...(fieldVisibility ?? undefined),
            remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
          })
          setIsUnlistedValue(true)
          break
        }
        case TrackAvailabilityType.PUBLIC: {
          setIsUnlistedValue(false)
          break
        }
      }
    },
    [
      setFieldVisibilityValue,
      setIsStreamGated,
      setIsUnlistedValue,
      setStreamConditionsValue,
      setPreviewValue,
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
    />
  )
}

type AccesAndSaleMenuFieldsProps = {
  streamConditions: SingleTrackEditValues[typeof STREAM_CONDITIONS]
  isRemix: boolean
  isUpload?: boolean
  isInitiallyUnlisted?: boolean
  isScheduledRelease?: boolean
  initialStreamConditions?: AccessConditions
}

export const AccessAndSaleMenuFields = (props: AccesAndSaleMenuFieldsProps) => {
  const {
    isRemix,
    isUpload,
    isInitiallyUnlisted,
    initialStreamConditions,
    isScheduledRelease
  } = props

  const { isEnabled: isUsdcEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { isEnabled: isCollectibleGatedEnabled } = useFlag(
    FeatureFlags.COLLECTIBLE_GATED_ENABLED
  )
  const { isEnabled: isSpecialAccessEnabled } = useFlag(
    FeatureFlags.SPECIAL_ACCESS_ENABLED
  )

  const [availabilityField] = useField({
    name: AVAILABILITY_TYPE
  })

  const { noSpecialAccessGate, noSpecialAccessGateFields, noHidden } =
    useAccessAndRemixSettings({
      isUpload: !!isUpload,
      isRemix,
      initialStreamConditions: initialStreamConditions ?? null,
      isInitiallyUnlisted: !!isInitiallyUnlisted,
      isScheduledRelease: !!isScheduledRelease
    })

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      {isRemix ? <HelpCallout content={messages.isRemix} /> : null}
      <Text>{messages.modalDescription}</Text>
      <RadioButtonGroup {...availabilityField} aria-label={messages.title}>
        <ModalRadioItem
          icon={<IconVisibilityPublic className={styles.icon} />}
          label={messages.public}
          description={messages.publicSubtitle}
          value={TrackAvailabilityType.PUBLIC}
        />
        {isUsdcEnabled ? (
          <UsdcPurchaseGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            initialStreamConditions={initialStreamConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
          />
        ) : null}

        {isSpecialAccessEnabled ? (
          <ModalRadioItem
            icon={<IconSpecialAccess />}
            label={messages.specialAccess}
            description={messages.specialAccessSubtitle}
            value={TrackAvailabilityType.SPECIAL_ACCESS}
            disabled={noSpecialAccessGate}
            checkedContent={
              <SpecialAccessFields disabled={noSpecialAccessGateFields} />
            }
          />
        ) : null}
        {isCollectibleGatedEnabled ? (
          <CollectibleGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            initialStreamConditions={initialStreamConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
          />
        ) : null}
        <ModalRadioItem
          icon={<IconHidden />}
          label={messages.hidden}
          value={TrackAvailabilityType.HIDDEN}
          description={messages.hiddenSubtitle}
          disabled={noHidden}
          // isInitiallyUnlisted is undefined on create
          // show hint on scheduled releases that are in create or already unlisted
          hintContent={
            isScheduledRelease && isInitiallyUnlisted !== false
              ? messages.hiddenHint
              : ''
          }
          checkedContent={<HiddenAvailabilityFields />}
        />
      </RadioButtonGroup>
    </div>
  )
}
