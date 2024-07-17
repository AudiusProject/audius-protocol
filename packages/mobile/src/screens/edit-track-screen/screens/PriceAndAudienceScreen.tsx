import { useCallback, useMemo, useState } from 'react'

import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { removeNullable } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { useField, useFormikContext } from 'formik'

import { Hint, IconCaretLeft, IconCart, Button } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { TopBarIconButton } from 'app/screens/app-screen'
import type { ListSelectionData } from 'app/screens/list-selection-screen'
import { ListSelectionScreen } from 'app/screens/list-selection-screen'
import { makeStyles } from 'app/styles'

import { CollectibleGatedAvailability } from '../components/CollectibleGatedAvailability'
import { HiddenAvailability } from '../components/HiddenAvailability'
import { SpecialAccessAvailability } from '../components/SpecialAccessAvailability'
import { PremiumRadioField } from '../fields/PriceAndAudienceField/PremiumRadioField/PremiumRadioField'
import { TRACK_PREVIEW } from '../fields/PriceAndAudienceField/PremiumRadioField/TrackPreviewField'
import { TRACK_PRICE } from '../fields/PriceAndAudienceField/PremiumRadioField/TrackPriceField'
import { PublicAvailabilityRadioField } from '../fields/PriceAndAudienceField/PublicAvailabilityRadioField'
import type { FormValues, RemixOfField } from '../types'

const messages = {
  title: 'Access & Sale',
  description:
    "Hidden tracks won't show up on your profile. Anyone who has the link will be able to listen.",
  hideTrack: 'Hide Track',
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count',
  markedAsRemix:
    'This track is marked as a remix. To enable additional availability options, unmark within Remix Settings.',
  done: 'Done'
}

const publicAvailability = StreamTrackAvailabilityType.PUBLIC
const premiumAvailability = StreamTrackAvailabilityType.USDC_PURCHASE
const specialAccessAvailability = StreamTrackAvailabilityType.SPECIAL_ACCESS
const collectibleGatedAvailability =
  StreamTrackAvailabilityType.COLLECTIBLE_GATED
const hiddenAvailability = StreamTrackAvailabilityType.HIDDEN

const useStyles = makeStyles(({ spacing }) => ({
  backButton: {
    marginLeft: -6
  },
  listItem: {
    paddingVertical: spacing(6)
  }
}))

const MarkedAsRemix = () => {
  const [{ value: remixOf }] = useField<RemixOfField>('remix_of')

  return remixOf ? <Hint m='l'>{messages.markedAsRemix}</Hint> : null
}

export const PriceAndAudienceScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
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
    disableCollectibleGateFields,
    disableHidden
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

  const data: ListSelectionData[] = [
    { label: publicAvailability, value: publicAvailability },
    isUsdcEnabled
      ? {
          label: premiumAvailability,
          value: premiumAvailability,
          disabled: disableUsdcGate
        }
      : null,
    {
      label: specialAccessAvailability,
      value: specialAccessAvailability,
      disabled: disableSpecialAccessGate
    },
    {
      label: collectibleGatedAvailability,
      value: collectibleGatedAvailability,
      disabled: disableCollectibleGate
    },
    {
      label: hiddenAvailability,
      value: hiddenAvailability,
      disabled: disableHidden
    }
  ].filter(removeNullable)

  const items = {
    [publicAvailability]: (
      <PublicAvailabilityRadioField
        selected={availability === StreamTrackAvailabilityType.PUBLIC}
      />
    )
  }

  if (isUsdcEnabled) {
    items[premiumAvailability] = (
      <PremiumRadioField
        selected={availability === StreamTrackAvailabilityType.USDC_PURCHASE}
        disabled={disableUsdcGate}
        disabledContent={disableUsdcGate}
        previousStreamConditions={previousStreamConditions}
      />
    )
  }

  items[specialAccessAvailability] = (
    <SpecialAccessAvailability
      selected={availability === StreamTrackAvailabilityType.SPECIAL_ACCESS}
      disabled={disableSpecialAccessGate}
      disabledContent={disableSpecialAccessGateFields}
      previousStreamConditions={previousStreamConditions}
    />
  )

  items[collectibleGatedAvailability] = (
    <CollectibleGatedAvailability
      selected={availability === StreamTrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={disableCollectibleGate}
      disabledContent={disableCollectibleGateFields}
      previousStreamConditions={previousStreamConditions}
    />
  )

  items[hiddenAvailability] = (
    <HiddenAvailability
      selected={availability === StreamTrackAvailabilityType.HIDDEN}
      disabled={disableHidden}
      isScheduledRelease={isScheduledRelease}
      isUnlisted={isUnlisted}
    />
  )

  /**
   * Do not navigate back if:
   * - track is collectible gated and user has not selected an nft collection, or
   * - track is usdc purchase gated and user has not selected a valid price or preview
   */
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
  const isFormInvalid =
    usdcGateIsInvalid || collectibleGateHasNoSelectedCollection

  const goBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <ListSelectionScreen
      data={data}
      renderItem={({ item }) => items[item.label]}
      screenTitle={messages.title}
      icon={IconCart}
      value={availability}
      onChange={setAvailability}
      disableSearch
      allowDeselect={false}
      hideSelectionLabel
      topbarLeft={
        <TopBarIconButton
          icon={IconCaretLeft}
          style={styles.backButton}
          onPress={isFormInvalid ? undefined : goBack}
        />
      }
      header={<MarkedAsRemix />}
      itemStyles={styles.listItem}
      bottomSection={
        <Button
          variant='primary'
          fullWidth
          onPress={goBack}
          disabled={isFormInvalid}
        >
          {messages.done}
        </Button>
      }
    />
  )
}
