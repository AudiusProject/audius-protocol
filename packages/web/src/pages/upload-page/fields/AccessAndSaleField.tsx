import { ChangeEvent, useCallback, useMemo } from 'react'

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
  useAccessAndRemixSettings
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
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'
import { defaultFieldVisibility } from 'pages/track-page/utils'

import {
  defaultHiddenFields,
  HiddenAvailabilityFields
} from '../fields/availability/HiddenAvailabilityFields'
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
      [PREMIUM_CONDITIONS]: z.nullable(
        z.object({
          usdc_purchase: z.optional(
            z.object({
              price: z
                .number({ invalid_type_error: messages.required })
                .lte(
                  maxContentPriceCents,
                  messages.errors.price.tooHigh(maxContentPriceCents)
                )
                .gte(
                  minContentPriceCents,
                  messages.errors.price.tooLow(minContentPriceCents)
                )
            })
          )
        })
      ),
      [PREVIEW]: z.optional(
        z.nullable(z.number({ invalid_type_error: messages.required }))
      ),
      [AVAILABILITY_TYPE]: z.nativeEnum(TrackAvailabilityType)
    })
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

  const usdcPurchaseConfig = useUSDCPurchaseConfig(useRemoteVar)

  // Fields from the outer form
  const [{ value: isUnlisted }, , { setValue: setIsUnlistedValue }] =
    useTrackField<SingleTrackEditValues[typeof IS_UNLISTED]>(IS_UNLISTED)
  const [{ value: isPremium }, , { setValue: setIsPremiumValue }] =
    useTrackField<SingleTrackEditValues[typeof IS_PREMIUM]>(IS_PREMIUM)
  const [
    { value: premiumConditions },
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

  const initialValues = useMemo(() => {
    const isUsdcGated = isPremiumContentUSDCPurchaseGated(premiumConditions)
    const isTipGated = isPremiumContentTipGated(premiumConditions)
    const isFollowGated = isPremiumContentFollowGated(premiumConditions)
    const isCollectibleGated =
      isPremiumContentCollectibleGated(premiumConditions)
    const initialValues = {}
    set(initialValues, IS_UNLISTED, isUnlisted)
    set(initialValues, IS_PREMIUM, isPremium)
    set(initialValues, PREMIUM_CONDITIONS, premiumConditions)

    let availabilityType = TrackAvailabilityType.PUBLIC
    if (isUsdcGated) {
      availabilityType = TrackAvailabilityType.USDC_PURCHASE
      set(
        initialValues,
        PRICE_HUMANIZED,
        premiumConditions.usdc_purchase.price
          ? (Number(premiumConditions.usdc_purchase.price) / 100).toFixed(2)
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
  }, [fieldVisibility, isPremium, isUnlisted, premiumConditions, preview])

  const handleSubmit = useCallback(
    (values: AccessAndSaleFormValues) => {
      setFieldVisibilityValue({
        ...defaultFieldVisibility,
        remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
      })
      setIsUnlistedValue(false)
      setPremiumConditionsValue(null)
      setPreviewValue(undefined)

      const availabilityType = get(values, AVAILABILITY_TYPE)
      switch (availabilityType) {
        case TrackAvailabilityType.USDC_PURCHASE: {
          setPreviewValue(get(values, PREVIEW) ?? 0)
          setIsPremiumValue(true)
          setPremiumConditionsValue({
            // @ts-ignore fully formed in saga (validated + added splits)
            usdc_purchase: {
              price: Math.round(get(values, PRICE))
            }
          })
          break
        }
        case TrackAvailabilityType.HIDDEN: {
          setFieldVisibilityValue({
            ...(get(values, FIELD_VISIBILITY) ?? undefined),
            remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
          })
          setIsUnlistedValue(true)
          break
        }
        case TrackAvailabilityType.COLLECTIBLE_GATED: {
          setPremiumConditionsValue(get(values, PREMIUM_CONDITIONS))
          if (get(values, PREMIUM_CONDITIONS)) {
            setIsPremiumValue(true)
          }
          break
        }
        case TrackAvailabilityType.SPECIAL_ACCESS: {
          const premiumConditions = get(values, PREMIUM_CONDITIONS)
          setPremiumConditionsValue(premiumConditions)
          if (get(values, PREMIUM_CONDITIONS)) {
            setIsPremiumValue(true)
          }
          break
        }
        case TrackAvailabilityType.PUBLIC: {
          setFieldVisibilityValue({
            ...defaultFieldVisibility,
            remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
          })
          break
        }
      }
    },
    [
      fieldVisibility?.remixes,
      setFieldVisibilityValue,
      setIsPremiumValue,
      setIsUnlistedValue,
      setPremiumConditionsValue,
      setPreviewValue
    ]
  )

  const renderValue = useCallback(() => {
    if (isPremiumContentCollectibleGated(premiumConditions)) {
      const { nft_collection } = premiumConditions
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

    if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
      selectedValues = [
        {
          label: messages.price(premiumConditions.usdc_purchase.price / 100),
          icon: IconCart
        }
      ]
      if (preview) {
        selectedValues.push({
          label: messages.preview(preview),
          icon: IconNote
        })
      }
    } else if (isPremiumContentFollowGated(premiumConditions)) {
      selectedValues = [specialAccessValue, messages.followersOnly]
    } else if (isPremiumContentTipGated(premiumConditions)) {
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
  }, [fieldVisibility, isUnlisted, premiumConditions, preview])

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
          premiumConditions={premiumConditions}
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

  const accountUserId = useSelector(getUserId)
  const { isEnabled: isUsdcEnabled } = useFlag(FeatureFlags.USDC_PURCHASES)
  const { isEnabled: isCollectibleGatedEnabled } = useFlag(
    FeatureFlags.COLLECTIBLE_GATED_ENABLED
  )
  const { isEnabled: isSpecialAccessEnabled } = useFlag(
    FeatureFlags.SPECIAL_ACCESS_ENABLED
  )
  const [
    { value: premiumConditionsValue },
    ,
    { setValue: setPremiumConditionsValue }
  ] =
    useField<AccessAndSaleFormValues[typeof PREMIUM_CONDITIONS]>(
      PREMIUM_CONDITIONS
    )
  const [
    { value: fieldVisibilityValue },
    ,
    { setValue: setfieldVisibilityValue }
  ] =
    useField<AccessAndSaleFormValues[typeof FIELD_VISIBILITY]>(FIELD_VISIBILITY)
  const [{ value: previewValue }, , { setValue: setPreviewValue }] =
    useField<AccessAndSaleFormValues[typeof PREVIEW]>(PREVIEW)

  const [availabilityField, , { setValue: setAvailabilityValue }] = useField({
    name: AVAILABILITY_TYPE
  })

  const { noSpecialAccessGate, noSpecialAccessGateFields, noHidden } =
    useAccessAndRemixSettings({
      isUpload: !!isUpload,
      isRemix,
      initialPremiumConditions: initialPremiumConditions ?? null,
      isInitiallyUnlisted: !!isInitiallyUnlisted
    })

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const type = e.target.value as TrackAvailabilityType
      switch (type) {
        case TrackAvailabilityType.PUBLIC: {
          setPremiumConditionsValue(null)
          setPreviewValue(undefined)
          break
        }
        case TrackAvailabilityType.USDC_PURCHASE: {
          if (!isPremiumContentUSDCPurchaseGated(premiumConditionsValue)) {
            setPremiumConditionsValue({
              // @ts-ignore fully formed in saga (validated + added splits)
              usdc_purchase: { price: null }
            })
          }
          setPreviewValue(previewValue ?? 0)
          break
        }
        case TrackAvailabilityType.SPECIAL_ACCESS: {
          if (
            !accountUserId ||
            isPremiumContentTipGated(premiumConditionsValue) ||
            isPremiumContentFollowGated(premiumConditionsValue)
          )
            break
          setPremiumConditionsValue({ follow_user_id: accountUserId })
          setPreviewValue(undefined)
          break
        }
        case TrackAvailabilityType.COLLECTIBLE_GATED:
          if (
            !accountUserId ||
            isPremiumContentCollectibleGated(premiumConditionsValue)
          )
            break
          setPremiumConditionsValue(null)
          setPreviewValue(undefined)
          break
        case TrackAvailabilityType.HIDDEN:
          setPremiumConditionsValue(null)
          setPreviewValue(undefined)
          if (!fieldVisibilityValue) break
          setfieldVisibilityValue({
            ...fieldVisibilityValue,
            ...defaultHiddenFields
          })
          break
      }
      setAvailabilityValue(type)
    },
    [
      accountUserId,
      fieldVisibilityValue,
      premiumConditionsValue,
      previewValue,
      setAvailabilityValue,
      setPremiumConditionsValue,
      setPreviewValue,
      setfieldVisibilityValue
    ]
  )

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      {isRemix ? <HelpCallout content={messages.isRemix} /> : null}
      <Text>{messages.modalDescription}</Text>
      <RadioButtonGroup
        {...availabilityField}
        onChange={handleChange}
        aria-label={messages.title}
      >
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
