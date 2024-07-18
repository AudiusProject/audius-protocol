import { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import { priceAndAudienceMessages as messages } from '@audius/common/messages'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { modalsActions } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'

import { Hint, IconCart } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { FormScreen } from 'app/screens/form-screen'

import { EditPriceAndAudienceConfirmationDrawer } from '../components/EditPriceAndAudienceConfirmationDrawer'
import { ExpandableRadio } from '../components/ExpandableRadio'
import { ExpandableRadioGroup } from '../components/ExpandableRadioGroup'
import { CollectibleGatedRadioField } from '../fields/GollectibleGatedRadioField'
import { PremiumRadioField } from '../fields/PriceAndAudienceField/PremiumRadioField/PremiumRadioField'
import { TRACK_PREVIEW } from '../fields/PriceAndAudienceField/PremiumRadioField/TrackPreviewField'
import { TRACK_PRICE } from '../fields/PriceAndAudienceField/PremiumRadioField/TrackPriceField'
import { SpecialAccessRadioField } from '../fields/SpecialAccessRadioField'
import type { FormValues, RemixOfField } from '../types'

const publicAvailability = StreamTrackAvailabilityType.PUBLIC

export const PriceAndAudienceScreen = () => {
  const { initialValues } = useFormikContext<FormValues>()
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')
  const [{ value: isUnlisted }] = useField<boolean>('is_unlisted')
  const [{ value: isScheduledRelease }] = useField<boolean>(
    'is_scheduled_release'
  )
  const [{ value: remixOf }] = useField<RemixOfField>('remix_of')
  const isRemix = !!remixOf

  const { isEnabled: isEditableAccessEnabled } = useFeatureFlag(
    FeatureFlags.EDITABLE_ACCESS_ENABLED
  )
  const { isEnabled: isUsdcEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )

  const isUpload = !initialValues?.track_id
  const initialStreamConditions = initialValues?.stream_conditions ?? null
  const initialAvailability = useMemo(() => {
    if (isUsdcEnabled && isContentUSDCPurchaseGated(streamConditions)) {
      return StreamTrackAvailabilityType.USDC_PURCHASE
    }
    if (isContentCollectibleGated(streamConditions)) {
      return StreamTrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (
      isContentFollowGated(streamConditions) ||
      isContentTipGated(streamConditions)
    ) {
      return StreamTrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isUnlisted && !isScheduledRelease) {
      return StreamTrackAvailabilityType.HIDDEN
    }
    return StreamTrackAvailabilityType.PUBLIC
    // we only care about what the initial value was here
    // eslint-disable-next-line
  }, [])

  const {
    disableUsdcGate: disableUsdcGateOption,
    disableSpecialAccessGate,
    disableSpecialAccessGateFields,
    disableCollectibleGate,
    disableCollectibleGateFields
  } = useAccessAndRemixSettings({
    isEditableAccessEnabled: !!isEditableAccessEnabled,
    isUpload,
    isRemix,
    initialStreamConditions,
    isInitiallyUnlisted: initialValues.is_unlisted,
    isScheduledRelease
  })

  const disableUsdcGate = disableUsdcGateOption || !isUsdcUploadEnabled

  const [availability, setAvailability] =
    useState<StreamTrackAvailabilityType>(initialAvailability)

  const previousStreamConditions = useMemo(
    () => streamConditions ?? initialStreamConditions,
    // we only care about what the initial value was here
    // eslint-disable-next-line
    []
  )

  const [{ value: price }, { error: priceError }] = useField(TRACK_PRICE)
  const [{ value: preview }, { error: previewError }] = useField(TRACK_PREVIEW)

  const usdcGateIsInvalid = useMemo(() => {
    // first time user selects usdc purchase option
    const priceNotSet = price === null
    const previewNotSet = preview === null
    return (
      isContentUSDCPurchaseGated(streamConditions) &&
      (!!priceError || priceNotSet || !!previewError || previewNotSet)
    )
  }, [streamConditions, price, priceError, preview, previewError])

  const collectibleGateHasNoSelectedCollection = useMemo(
    () =>
      isContentCollectibleGated(streamConditions) &&
      !streamConditions.nft_collection,
    [streamConditions]
  )

  /**
   * Do not navigate back if:
   * - track is collectible gated and user has not selected an nft collection, or
   * - track is usdc purchase gated and user has not selected a valid price or preview
   */
  const isFormInvalid =
    usdcGateIsInvalid || collectibleGateHasNoSelectedCollection

  const dispatch = useDispatch()
  const navigation = useNavigation()
  const [usersMayLoseAccess, setUsersMayLoseAccess] = useState(false)
  const [specialAccessType, setSpecialAccessType] =
    useState<Nullable<'follow' | 'tip'>>(null)
  const isInitiallyUsdcGated = isContentUSDCPurchaseGated(
    initialStreamConditions
  )
  const isInitiallyTipGated = isContentTipGated(initialStreamConditions)
  const isInitiallyFollowGated = isContentFollowGated(initialStreamConditions)
  const isInitiallyCollectibleGated = isContentCollectibleGated(
    initialStreamConditions
  )

  useEffect(() => {
    if (isContentFollowGated(streamConditions)) {
      setSpecialAccessType('follow')
    } else if (isContentTipGated(streamConditions)) {
      setSpecialAccessType('tip')
    }
    const stillUsdcGated =
      isInitiallyUsdcGated &&
      availability === StreamTrackAvailabilityType.USDC_PURCHASE
    const stillFollowGated =
      isInitiallyFollowGated &&
      availability === StreamTrackAvailabilityType.SPECIAL_ACCESS &&
      specialAccessType === 'follow'
    const stillTipGated =
      isInitiallyTipGated &&
      availability === StreamTrackAvailabilityType.SPECIAL_ACCESS &&
      specialAccessType === 'tip'
    const stillCollectibleGated =
      isInitiallyCollectibleGated &&
      availability === StreamTrackAvailabilityType.COLLECTIBLE_GATED
    const stillSameGate =
      stillUsdcGated ||
      stillFollowGated ||
      stillTipGated ||
      stillCollectibleGated
    setUsersMayLoseAccess(
      !stillSameGate &&
        // why do we have both FREE and PUBLIC types
        // and when is one used over the other?
        ![
          StreamTrackAvailabilityType.FREE,
          StreamTrackAvailabilityType.PUBLIC
        ].includes(availability)
    )
  }, [
    availability,
    isInitiallyCollectibleGated,
    isInitiallyFollowGated,
    isInitiallyTipGated,
    isInitiallyUsdcGated,
    specialAccessType,
    streamConditions
  ])

  const handleSubmit = useCallback(() => {
    if (isEditableAccessEnabled && usersMayLoseAccess) {
      dispatch(
        modalsActions.setVisibility({
          modal: 'EditPriceAndAudienceConfirmation',
          visible: true
        })
      )
    }
  }, [dispatch, isEditableAccessEnabled, usersMayLoseAccess])

  const handleCancel = useCallback(() => {
    dispatch(
      modalsActions.setVisibility({
        modal: 'EditPriceAndAudienceConfirmation',
        visible: false
      })
    )
  }, [dispatch])

  return (
    <FormScreen
      title={messages.title}
      icon={IconCart}
      variant='white'
      disableSubmit={isFormInvalid}
      stopNavigation={usersMayLoseAccess}
      onSubmit={handleSubmit}
    >
      {isRemix ? <Hint m='l'>{messages.markedAsRemix}</Hint> : null}
      <ExpandableRadioGroup
        value={availability}
        onValueChange={setAvailability}
      >
        <ExpandableRadio
          value={publicAvailability}
          label={messages.freeRadio.title}
          description={messages.freeRadio.description('track')}
        />
        <PremiumRadioField
          disabled={disableUsdcGate}
          previousStreamConditions={previousStreamConditions}
        />
        <SpecialAccessRadioField
          disabled={disableSpecialAccessGate || disableSpecialAccessGateFields}
          previousStreamConditions={previousStreamConditions}
        />
        <CollectibleGatedRadioField
          disabled={disableCollectibleGate || disableCollectibleGateFields}
          previousStreamConditions={previousStreamConditions}
        />
      </ExpandableRadioGroup>
      <EditPriceAndAudienceConfirmationDrawer
        onConfirm={navigation.goBack}
        onCancel={handleCancel}
      />
    </FormScreen>
  )
}
