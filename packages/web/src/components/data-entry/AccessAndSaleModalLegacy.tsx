import { useMemo } from 'react'

import {
  Track,
  TrackAvailabilityType,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentUSDCPurchaseGated,
  useUSDCPurchaseConfig
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
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { TrackMetadataState } from 'components/track-availability-modal/types'
import { useRemoteVar } from 'hooks/useRemoteConfig'
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
  PRICE,
  PRICE_HUMANIZED,
  SPECIAL_ACCESS_TYPE
} from 'pages/upload-page/fields/AccessAndSaleField'
import { SpecialAccessType } from 'pages/upload-page/fields/availability/SpecialAccessFields'

import styles from './AccessAndSaleModalLegacy.module.css'
import { ContextualMenu } from './ContextualMenu'

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

type AccessAndSaleModalLegacyProps = {
  isRemix: boolean
  isUpload: boolean
  initialForm: Track
  metadataState: TrackMetadataState
  trackLength: number
  didUpdateState: (newState: TrackMetadataState) => void
}

export const AccessAndSaleModalLegacy = (
  props: AccessAndSaleModalLegacyProps
) => {
  const {
    isUpload,
    isRemix,
    initialForm,
    metadataState,
    trackLength,
    didUpdateState
  } = props
  const {
    premium_conditions: premiumConditions,
    unlisted: isUnlisted,
    is_premium: isPremium,
    preview_start_seconds: preview,
    ...fieldVisibility
  } = metadataState

  const usdcPurchaseConfig = useUSDCPurchaseConfig(useRemoteVar)

  const initialValues: AccessAndSaleFormValues = useMemo(() => {
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
        (Number(premiumConditions.usdc_purchase.price || 0) / 100).toFixed(2)
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

  const onSubmit = (values: AccessAndSaleFormValues) => {
    let newState = {
      ...metadataState
    }

    const availabilityType = get(values, AVAILABILITY_TYPE)
    switch (availabilityType) {
      case TrackAvailabilityType.PUBLIC: {
        newState.is_premium = false
        newState.unlisted = false
        newState.premium_conditions = null
        break
      }
      case TrackAvailabilityType.USDC_PURCHASE: {
        newState.is_premium = true
        const price = Math.round(get(values, PRICE))
        newState.premium_conditions = {
          // @ts-ignore splits get added in saga
          usdc_purchase: {
            price
          }
        }
        newState.preview_start_seconds = get(values, PREVIEW) ?? 0
        break
      }
      case TrackAvailabilityType.COLLECTIBLE_GATED:
      case TrackAvailabilityType.SPECIAL_ACCESS: {
        newState.is_premium = true
        newState.premium_conditions = get(values, PREMIUM_CONDITIONS)
        break
      }
    }

    if (get(values, AVAILABILITY_TYPE) === TrackAvailabilityType.HIDDEN) {
      newState = {
        ...newState,
        ...(get(values, FIELD_VISIBILITY) ?? undefined),
        premium_conditions: null,
        unlisted: true
      }
    } else {
      newState = {
        ...newState,
        ...defaultFieldVisibility,
        unlisted: false
      }
    }

    didUpdateState(newState)
  }

  let availabilityButtonTitle = messages.public
  let AvailabilityIcon = IconVisibilityPublic
  if (isUnlisted) {
    availabilityButtonTitle = messages.hidden
    AvailabilityIcon = IconHidden
  } else if (isPremium) {
    if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
      availabilityButtonTitle = messages.premium
      AvailabilityIcon = IconCart
    } else if (isPremiumContentCollectibleGated(premiumConditions)) {
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
          initialPremiumConditions={
            initialForm[PREMIUM_CONDITIONS] ?? undefined
          }
          premiumConditions={metadataState.premium_conditions}
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
