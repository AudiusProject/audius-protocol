import { useMemo } from 'react'

import {
  PremiumConditionsCollectibleGated,
  PremiumConditionsFollowGated,
  PremiumConditionsTipGated,
  PremiumConditionsUSDCPurchase,
  Track,
  TrackAvailabilityType,
  accountSelectors,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentUSDCPurchaseGated,
  useUSDCPurchaseConfig,
  Nullable,
  PremiumConditions
} from '@audius/common'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconCart,
  IconCollectible,
  IconHidden,
  IconSpecialAccess,
  IconVisibilityPublic
} from '@audius/stems'
import { set, get } from 'lodash'
import { useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { defaultFieldVisibility } from 'pages/track-page/utils'
import {
  AVAILABILITY_TYPE,
  AccessAndSaleFormSchema,
  AccessAndSaleFormValues,
  AccessAndSaleMenuFields,
  FIELD_VISIBILITY,
  IS_PREMIUM,
  IS_UNLISTED,
  PREMIUM_CONDITIONS,
  PREVIEW,
  PRICE_HUMANIZED,
  SPECIAL_ACCESS_TYPE,
  getCombinedDefaultPremiumConditionValues
} from 'pages/upload-page/fields/AccessAndSaleField'
import { SpecialAccessType } from 'pages/upload-page/fields/availability/SpecialAccessFields'

import styles from './AccessAndSaleTriggerLegacy.module.css'
import { ContextualMenu } from './ContextualMenu'

const { getUserId } = accountSelectors

const messages = {
  title: 'Access & Sale',
  description:
    "Customize your music's availability for different audiences, and create personalized gated experiences for your fans.",
  public: 'Public (Default)',
  premium: 'Premium',
  specialAccess: 'Special Access',
  collectibleGated: 'Collectible Gated',
  hidden: 'Hidden'
}

enum PremiumTrackMetadataField {
  IS_PREMIUM = 'is_premium',
  PREMIUM_CONDITIONS = 'premium_conditions',
  PREVIEW = 'preview_start_seconds'
}

enum UnlistedTrackMetadataField {
  SCHEDULED_RELEASE = 'scheduled_release',
  UNLISTED = 'unlisted',
  GENRE = 'genre',
  MOOD = 'mood',
  TAGS = 'tags',
  SHARE = 'share',
  PLAYS = 'plays'
}

type TrackMetadataState = {
  [PremiumTrackMetadataField.IS_PREMIUM]: boolean
  [PremiumTrackMetadataField.PREMIUM_CONDITIONS]: Nullable<PremiumConditions>
  [PremiumTrackMetadataField.PREVIEW]: Nullable<number>
  [UnlistedTrackMetadataField.SCHEDULED_RELEASE]: boolean
  [UnlistedTrackMetadataField.UNLISTED]: boolean
  [UnlistedTrackMetadataField.GENRE]: boolean
  [UnlistedTrackMetadataField.MOOD]: boolean
  [UnlistedTrackMetadataField.TAGS]: boolean
  [UnlistedTrackMetadataField.SHARE]: boolean
  [UnlistedTrackMetadataField.PLAYS]: boolean
}

type AccessAndSaleTriggerLegacyProps = {
  isRemix: boolean
  isUpload: boolean
  initialForm: Track
  metadataState: TrackMetadataState
  trackLength: number
  didUpdateState: (newState: TrackMetadataState) => void
}

export const AccessAndSaleTriggerLegacy = (
  props: AccessAndSaleTriggerLegacyProps
) => {
  const {
    isUpload,
    isRemix,
    initialForm,
    metadataState,
    trackLength,
    didUpdateState
  } = props
  const initialPremiumConditions = initialForm[PREMIUM_CONDITIONS]
  const {
    premium_conditions: savedPremiumConditions,
    unlisted: isUnlisted,
    scheduled_release: isScheduledRelease,
    is_premium: isPremium,
    preview_start_seconds: preview,
    ...fieldVisibility
  } = metadataState
  console.log('asdf access edit isScheduledRelease: ', isScheduledRelease, isUnlisted)
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

  const usdcPurchaseConfig = useUSDCPurchaseConfig()

  const initialValues: AccessAndSaleFormValues = useMemo(() => {
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
    if (isUnlisted && !isScheduledRelease) {
      availabilityType = TrackAvailabilityType.HIDDEN
    }
    set(initialValues, AVAILABILITY_TYPE, availabilityType)
    set(initialValues, FIELD_VISIBILITY, fieldVisibility)
    set(initialValues, PREVIEW, preview)
    set(
      initialValues,
      SPECIAL_ACCESS_TYPE,
      // Since we're in edit mode, we check if the track was initially tip gated
      isTipGated || isPremiumContentTipGated(initialPremiumConditions)
        ? SpecialAccessType.TIP
        : SpecialAccessType.FOLLOW
    )
    return initialValues as AccessAndSaleFormValues
  }, [
    fieldVisibility,
    isPremium,
    isUnlisted,
    savedPremiumConditions,
    tempPremiumConditions,
    initialPremiumConditions,
    preview
  ])

  const onSubmit = (values: AccessAndSaleFormValues) => {
    const availabilityType = get(values, AVAILABILITY_TYPE)
    const preview = get(values, PREVIEW)
    const specialAccessType = get(values, SPECIAL_ACCESS_TYPE)
    const fieldVisibility = get(values, FIELD_VISIBILITY)
    const premiumConditions = get(values, PREMIUM_CONDITIONS)

    let newState = {
      ...metadataState,
      ...defaultFieldVisibility,
      remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
    }
    newState.unlisted = isScheduledRelease ? isUnlisted : false
    newState.is_premium = false
    newState.premium_conditions = null
    newState.preview_start_seconds = null

    // For gated options, extract the correct premium conditions based on the selected availability type
    switch (availabilityType) {
      case TrackAvailabilityType.USDC_PURCHASE: {
        newState.preview_start_seconds = preview ?? 0
        const {
          usdc_purchase: { price }
        } = premiumConditions as PremiumConditionsUSDCPurchase
        newState.premium_conditions = {
          // @ts-ignore splits get added in saga
          usdc_purchase: { price: Math.round(price) }
        }
        newState.is_premium = true
        break
      }
      case TrackAvailabilityType.SPECIAL_ACCESS: {
        if (specialAccessType === SpecialAccessType.FOLLOW) {
          const { follow_user_id } =
            premiumConditions as PremiumConditionsFollowGated
          newState.premium_conditions = { follow_user_id }
        } else {
          const { tip_user_id } = premiumConditions as PremiumConditionsTipGated
          newState.premium_conditions = { tip_user_id }
        }
        newState.is_premium = true
        break
      }
      case TrackAvailabilityType.COLLECTIBLE_GATED: {
        const { nft_collection } =
          premiumConditions as PremiumConditionsCollectibleGated
        newState.premium_conditions = { nft_collection }
        newState.is_premium = true
        break
      }
      case TrackAvailabilityType.HIDDEN: {
        newState = {
          ...newState,
          ...(fieldVisibility ?? undefined),
          remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes,
          unlisted: true
        }
        break
      }
      case TrackAvailabilityType.PUBLIC: {
        break
      }
    }

    didUpdateState(newState)
  }

  let availabilityButtonTitle = messages.public
  let AvailabilityIcon = IconVisibilityPublic
  if (isUnlisted && !isScheduledRelease) {
    availabilityButtonTitle = messages.hidden
    AvailabilityIcon = IconHidden
  } else if (isPremium) {
    if (isPremiumContentUSDCPurchaseGated(savedPremiumConditions)) {
      availabilityButtonTitle = messages.premium
      AvailabilityIcon = IconCart
    } else if (isPremiumContentCollectibleGated(savedPremiumConditions)) {
      availabilityButtonTitle = messages.collectibleGated
      AvailabilityIcon = IconCollectible
    } else {
      availabilityButtonTitle = messages.specialAccess
      AvailabilityIcon = IconSpecialAccess
    }
  }

  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconHidden />}
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(
        AccessAndSaleFormSchema(trackLength, usdcPurchaseConfig)
      )}
      menuFields={
        <AccessAndSaleMenuFields
          isRemix={isRemix}
          isUpload={isUpload}
          isInitiallyUnlisted={initialForm[IS_UNLISTED]}
          initialPremiumConditions={initialPremiumConditions ?? undefined}
          premiumConditions={tempPremiumConditions}
          isScheduledRelease={isScheduledRelease}
        />
      }
      renderValue={() => null}
      previewOverride={(toggleMenu) => (
        <Button
          className={styles.availabilityButton}
          type={ButtonType.COMMON_ALT}
          name='availabilityModal'
          text={availabilityButtonTitle}
          size={ButtonSize.SMALL}
          onClick={toggleMenu}
          leftIcon={<AvailabilityIcon />}
        />
      )}
    />
  )
}
