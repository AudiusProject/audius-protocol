import { useCallback, useMemo } from 'react'

import {
  accountSelectors,
  FeatureFlags,
  FieldVisibility,
  formatPrice,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentUSDCPurchaseGated,
  Nullable,
  PremiumConditions,
  TrackAvailabilityType,
  USDCPurchaseConfig,
  useUSDCPurchaseConfig,
  useAccessAndRemixSettings,
  PremiumConditionsCollectibleGated,
  PremiumConditionsUSDCPurchase,
  PremiumConditionsFollowGated,
  PremiumConditionsTipGated,
  ID,
  useFeatureFlag
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
import {
  SpecialAccessFields,
  SpecialAccessType
} from '../fields/availability/SpecialAccessFields'
import { useIndexedField, useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import styles from './AccessAndSaleField.module.css'
import { REMIX_OF } from './RemixSettingsField'
import { CollectibleGatedRadioField } from './availability/collectible-gated/CollectibleGatedRadioField'
import { UsdcPurchaseGatedRadioField } from './availability/usdc-purchase-gated/UsdcPurchaseGatedRadioField'
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

export const IS_UNLISTED = 'is_unlisted'
export const IS_PREMIUM = 'is_premium'
export const PREMIUM_CONDITIONS = 'premium_conditions'

export const AVAILABILITY_TYPE = 'availability_type'
export const SPECIAL_ACCESS_TYPE = 'special_access_type'
export const FIELD_VISIBILITY = 'field_visibility'
export const PRICE = 'premium_conditions.usdc_purchase.price'
export const PRICE_HUMANIZED = 'price_humanized'
export const PREVIEW = 'preview_start_seconds'

export type AccessAndSaleFormValues = {
  [IS_UNLISTED]: boolean
  [AVAILABILITY_TYPE]: TrackAvailabilityType
  [PREMIUM_CONDITIONS]: Nullable<PremiumConditions>
  [SPECIAL_ACCESS_TYPE]: Nullable<SpecialAccessType>
  [FIELD_VISIBILITY]: FieldVisibility
  [PRICE_HUMANIZED]: string
  [PREVIEW]?: number
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
      [PREMIUM_CONDITIONS]: z.any(),
      [PREVIEW]: z.optional(
        z.nullable(z.number({ invalid_type_error: messages.required }))
      ),
      [AVAILABILITY_TYPE]: z.nativeEnum(TrackAvailabilityType)
    })
    .refine(
      (values) => {
        const formValues = values as AccessAndSaleFormValues
        const premiumConditions = formValues[PREMIUM_CONDITIONS]
        if (
          formValues[AVAILABILITY_TYPE] === 'USDC_PURCHASE' &&
          isPremiumContentUSDCPurchaseGated(premiumConditions)
        ) {
          const { price } = premiumConditions.usdc_purchase
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
        const premiumConditions = formValues[PREMIUM_CONDITIONS]
        if (
          formValues[AVAILABILITY_TYPE] === 'USDC_PURCHASE' &&
          isPremiumContentUSDCPurchaseGated(premiumConditions)
        ) {
          return premiumConditions.usdc_purchase.price <= maxContentPriceCents
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
 * premium conditions based on the availability type they have currently selected.
 */
export const getCombinedDefaultPremiumConditionValues = (
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
  const [{ value: isPremium }, , { setValue: setIsPremiumValue }] =
    useTrackField<SingleTrackEditValues[typeof IS_PREMIUM]>(IS_PREMIUM)
  const [
    { value: savedPremiumConditions },
    ,
    { setValue: setPremiumConditionsValue }
  ] =
    useTrackField<SingleTrackEditValues[typeof PREMIUM_CONDITIONS]>(
      PREMIUM_CONDITIONS
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
   * Premium conditions from inside the modal.
   * Upon submit, these values along with the selected access option will
   * determine the final premium conditions that get saved to the track.
   */
  const accountUserId = useSelector(getUserId)
  const tempPremiumConditions = useMemo(
    () => ({
      ...getCombinedDefaultPremiumConditionValues(accountUserId),
      ...savedPremiumConditions
    }),
    [accountUserId, savedPremiumConditions]
  )

  const initialValues = useMemo(() => {
    const isUsdcGated = isPremiumContentUSDCPurchaseGated(
      savedPremiumConditions
    )
    const isTipGated = isPremiumContentTipGated(savedPremiumConditions)
    const isFollowGated = isPremiumContentFollowGated(savedPremiumConditions)
    const isCollectibleGated = isPremiumContentCollectibleGated(
      savedPremiumConditions
    )

    const initialValues = {}
    set(initialValues, IS_UNLISTED, isUnlisted)
    set(initialValues, IS_PREMIUM, isPremium)
    set(initialValues, PREMIUM_CONDITIONS, tempPremiumConditions)

    let availabilityType = TrackAvailabilityType.PUBLIC
    if (isUsdcGated) {
      availabilityType = TrackAvailabilityType.USDC_PURCHASE
      set(
        initialValues,
        PRICE_HUMANIZED,
        tempPremiumConditions.usdc_purchase.price
          ? (Number(tempPremiumConditions.usdc_purchase.price) / 100).toFixed(2)
          : undefined
      )
    }
    if (isFollowGated || isTipGated) {
      availabilityType = TrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isCollectibleGated) {
      availabilityType = TrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (isUnlisted) {
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
    savedPremiumConditions,
    isUnlisted,
    isPremium,
    tempPremiumConditions,
    fieldVisibility,
    preview,
    setIsUnlistedValue
  ])

  const handleSubmit = useCallback(
    (values: AccessAndSaleFormValues) => {
      const availabilityType = get(values, AVAILABILITY_TYPE)
      const preview = get(values, PREVIEW)
      const specialAccessType = get(values, SPECIAL_ACCESS_TYPE)
      const fieldVisibility = get(values, FIELD_VISIBILITY)
      const premiumConditions = get(values, PREMIUM_CONDITIONS)

      setFieldVisibilityValue({
        ...defaultFieldVisibility,
        remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
      })
      setIsUnlistedValue(false)
      setIsPremiumValue(false)
      setPremiumConditionsValue(null)
      setPreviewValue(undefined)

      // For gated options, extract the correct premium conditions based on the selected availability type
      switch (availabilityType) {
        case TrackAvailabilityType.USDC_PURCHASE: {
          setPreviewValue(preview ?? 0)
          const {
            usdc_purchase: { price }
          } = premiumConditions as PremiumConditionsUSDCPurchase
          setPremiumConditionsValue({
            // @ts-ignore fully formed in saga (validated + added splits)
            usdc_purchase: { price: Math.round(price) }
          })
          setIsPremiumValue(true)
          break
        }
        case TrackAvailabilityType.SPECIAL_ACCESS: {
          if (specialAccessType === SpecialAccessType.FOLLOW) {
            const { follow_user_id } =
              premiumConditions as PremiumConditionsFollowGated
            setPremiumConditionsValue({ follow_user_id })
          } else {
            const { tip_user_id } =
              premiumConditions as PremiumConditionsTipGated
            setPremiumConditionsValue({ tip_user_id })
          }
          setIsPremiumValue(true)
          break
        }
        case TrackAvailabilityType.COLLECTIBLE_GATED: {
          const { nft_collection } =
            premiumConditions as PremiumConditionsCollectibleGated
          setPremiumConditionsValue({ nft_collection })
          setIsPremiumValue(true)
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
          break
        }
      }
    },
    [
      setFieldVisibilityValue,
      setIsPremiumValue,
      setIsUnlistedValue,
      setPremiumConditionsValue,
      setPreviewValue
    ]
  )

  const renderValue = useCallback(() => {
    if (isPremiumContentCollectibleGated(savedPremiumConditions)) {
      const { nft_collection } = savedPremiumConditions
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

    if (isPremiumContentUSDCPurchaseGated(savedPremiumConditions)) {
      selectedValues = [
        {
          label: messages.price(
            savedPremiumConditions.usdc_purchase.price / 100
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
    } else if (isPremiumContentFollowGated(savedPremiumConditions)) {
      selectedValues = [specialAccessValue, messages.followersOnly]
    } else if (isPremiumContentTipGated(savedPremiumConditions)) {
      selectedValues = [specialAccessValue, messages.supportersOnly]
    } else if (isUnlisted && fieldVisibility) {
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
  }, [fieldVisibility, isUnlisted, savedPremiumConditions, preview])

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
          premiumConditions={tempPremiumConditions}
        />
      }
    />
  )
}

type AccesAndSaleMenuFieldsProps = {
  premiumConditions: SingleTrackEditValues[typeof PREMIUM_CONDITIONS]
  isRemix: boolean
  isUpload?: boolean
  isInitiallyUnlisted?: boolean
  initialPremiumConditions?: PremiumConditions
}

export const AccessAndSaleMenuFields = (props: AccesAndSaleMenuFieldsProps) => {
  const { isRemix, isUpload, isInitiallyUnlisted, initialPremiumConditions } =
    props

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
      initialPremiumConditions: initialPremiumConditions ?? null,
      isInitiallyUnlisted: !!isInitiallyUnlisted
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
            initialPremiumConditions={initialPremiumConditions}
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
            initialPremiumConditions={initialPremiumConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
          />
        ) : null}
        <ModalRadioItem
          icon={<IconHidden />}
          label={messages.hidden}
          value={TrackAvailabilityType.HIDDEN}
          description={messages.hiddenSubtitle}
          disabled={noHidden}
          checkedContent={<HiddenAvailabilityFields />}
        />
      </RadioButtonGroup>
    </div>
  )
}
