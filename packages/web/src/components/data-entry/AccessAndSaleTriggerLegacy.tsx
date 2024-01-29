import { useMemo } from 'react'

import {
  CollectibleGatedConditions,
  FollowGatedConditions,
  TipGatedConditions,
  USDCPurchaseConditions,
  Track,
  StreamTrackAvailabilityType,
  accountSelectors,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  useUSDCPurchaseConfig,
  Nullable,
  AccessConditions
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
  STREAM_AVAILABILITY_TYPE,
  AccessAndSaleFormSchema,
  AccessAndSaleFormValues,
  FIELD_VISIBILITY,
  IS_STREAM_GATED,
  IS_UNLISTED,
  STREAM_CONDITIONS,
  PREVIEW,
  PRICE_HUMANIZED,
  SPECIAL_ACCESS_TYPE,
  getCombinedDefaultGatedConditionValues
} from 'pages/upload-page/fields/AccessAndSaleField'
import { AccessAndSaleMenuFields } from 'pages/upload-page/fields/AccessAndSaleMenuFields'
import { SpecialAccessType } from 'pages/upload-page/fields/stream-availability/SpecialAccessFields'

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

enum GatedTrackMetadataField {
  IS_STREAM_GATED = 'is_stream_gated',
  STREAM_CONDITIONS = 'stream_conditions',
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
  [GatedTrackMetadataField.IS_STREAM_GATED]: boolean
  [GatedTrackMetadataField.STREAM_CONDITIONS]: Nullable<AccessConditions>
  [GatedTrackMetadataField.PREVIEW]: Nullable<number>
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
  const initialStreamConditions = initialForm[STREAM_CONDITIONS]
  const {
    stream_conditions: savedStreamConditions,
    unlisted: isUnlisted,
    scheduled_release: isScheduledRelease,
    is_stream_gated: isStreamGated,
    preview_start_seconds: preview,
    ...fieldVisibility
  } = metadataState
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

  const usdcPurchaseConfig = useUSDCPurchaseConfig()

  const initialValues: AccessAndSaleFormValues = useMemo(() => {
    const isUsdcGated = isContentUSDCPurchaseGated(savedStreamConditions)
    const isTipGated = isContentTipGated(savedStreamConditions)
    const isFollowGated = isContentFollowGated(savedStreamConditions)
    const isCollectibleGated = isContentCollectibleGated(savedStreamConditions)

    const initialValues = {}
    set(initialValues, IS_UNLISTED, isUnlisted)
    set(initialValues, IS_STREAM_GATED, isStreamGated)
    set(initialValues, STREAM_CONDITIONS, tempStreamConditions)

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
      // Since we're in edit mode, we check if the track was initially tip gated
      isTipGated || isContentTipGated(initialStreamConditions)
        ? SpecialAccessType.TIP
        : SpecialAccessType.FOLLOW
    )
    return initialValues as AccessAndSaleFormValues
  }, [
    fieldVisibility,
    isStreamGated,
    isUnlisted,
    savedStreamConditions,
    tempStreamConditions,
    initialStreamConditions,
    preview,
    isScheduledRelease
  ])

  const onSubmit = (values: AccessAndSaleFormValues) => {
    const availabilityType = get(values, STREAM_AVAILABILITY_TYPE)
    const preview = get(values, PREVIEW)
    const specialAccessType = get(values, SPECIAL_ACCESS_TYPE)
    const fieldVisibility = get(values, FIELD_VISIBILITY)
    const streamConditions = get(values, STREAM_CONDITIONS)

    let newState = {
      ...metadataState,
      ...defaultFieldVisibility,
      remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
    }
    newState.unlisted = isScheduledRelease ? isUnlisted : false
    newState.is_stream_gated = false
    newState.stream_conditions = null
    newState.preview_start_seconds = null

    // For gated options, extract the correct stream conditions based on the selected availability type
    switch (availabilityType) {
      case StreamTrackAvailabilityType.USDC_PURCHASE: {
        newState.preview_start_seconds = preview ?? 0
        const {
          usdc_purchase: { price }
        } = streamConditions as USDCPurchaseConditions
        newState.stream_conditions = {
          // @ts-ignore splits get added in saga
          usdc_purchase: { price: Math.round(price) }
        }
        newState.is_stream_gated = true
        break
      }
      case StreamTrackAvailabilityType.SPECIAL_ACCESS: {
        if (specialAccessType === SpecialAccessType.FOLLOW) {
          const { follow_user_id } = streamConditions as FollowGatedConditions
          newState.stream_conditions = { follow_user_id }
        } else {
          const { tip_user_id } = streamConditions as TipGatedConditions
          newState.stream_conditions = { tip_user_id }
        }
        newState.is_stream_gated = true
        break
      }
      case StreamTrackAvailabilityType.COLLECTIBLE_GATED: {
        const { nft_collection } =
          streamConditions as CollectibleGatedConditions
        newState.stream_conditions = { nft_collection }
        newState.is_stream_gated = true
        break
      }
      case StreamTrackAvailabilityType.HIDDEN: {
        newState = {
          ...newState,
          ...(fieldVisibility ?? undefined),
          remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes,
          unlisted: true
        }
        break
      }
      case StreamTrackAvailabilityType.PUBLIC: {
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
  } else if (isStreamGated) {
    if (isContentUSDCPurchaseGated(savedStreamConditions)) {
      availabilityButtonTitle = messages.premium
      AvailabilityIcon = IconCart
    } else if (isContentCollectibleGated(savedStreamConditions)) {
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
          initialStreamConditions={initialStreamConditions ?? undefined}
          streamConditions={tempStreamConditions}
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
