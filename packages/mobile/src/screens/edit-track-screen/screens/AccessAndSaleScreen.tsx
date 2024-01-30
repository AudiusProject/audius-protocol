import { useCallback, useMemo, useState } from 'react'

import type { Nullable } from '@audius/common'
import { FeatureFlags, removeNullable } from '@audius/common'
import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  TrackAvailabilityType
} from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { useField, useFormikContext } from 'formik'

import IconCaretLeft from 'app/assets/images/iconCaretLeft.svg'
import IconCart from 'app/assets/images/iconCart.svg'
import { Button } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { TopBarIconButton } from 'app/screens/app-screen'
import { makeStyles } from 'app/styles'

import { CollectibleGatedAvailability } from '../components/CollectibleGatedAvailability'
import { HiddenAvailability } from '../components/HiddenAvailability'
import { SpecialAccessAvailability } from '../components/SpecialAccessAvailability'
import { PremiumRadioField } from '../fields/AccessAndSaleField/PremiumRadioField/PremiumRadioField'
import { TRACK_PREVIEW } from '../fields/AccessAndSaleField/PremiumRadioField/TrackPreviewField'
import { TRACK_PRICE } from '../fields/AccessAndSaleField/PremiumRadioField/TrackPriceField'
import { PublicAvailabilityRadioField } from '../fields/AccessAndSaleField/PublicAvailabilityRadioField'
import type { FormValues, RemixOfField } from '../types'

import type { ListSelectionData } from './ListSelectionScreen'
import { ListSelectionScreen } from './ListSelectionScreen'

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

const publicAvailability = TrackAvailabilityType.PUBLIC
const premiumAvailability = TrackAvailabilityType.USDC_PURCHASE
const specialAccessAvailability = TrackAvailabilityType.SPECIAL_ACCESS
const collectibleGatedAvailability = TrackAvailabilityType.COLLECTIBLE_GATED
const hiddenAvailability = TrackAvailabilityType.HIDDEN

const useStyles = makeStyles(({ spacing }) => ({
  backButton: {
    marginLeft: -6
  },
  isRemix: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(4),
    marginHorizontal: spacing(4),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4)
  },
  listItem: {
    paddingVertical: spacing(6)
  }
}))

const MarkedAsRemix = () => {
  const styles = useStyles()
  const [{ value: remixOf }] = useField<RemixOfField>('remix_of')

  return remixOf ? (
    <HelpCallout style={styles.isRemix} content={messages.markedAsRemix} />
  ) : null
}

export const AccessAndSaleScreen = () => {
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
      return TrackAvailabilityType.USDC_PURCHASE
    }
    if (isContentCollectibleGated(streamConditions)) {
      return TrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (
      isContentFollowGated(streamConditions) ||
      isContentTipGated(streamConditions)
    ) {
      return TrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isUnlisted && !isScheduledRelease) {
      return TrackAvailabilityType.HIDDEN
    }
    return TrackAvailabilityType.PUBLIC
    // we only care about what the initial value was here
    // eslint-disable-next-line
  }, [])

  const {
    noUsdcGate: noUsdcGateOption,
    noSpecialAccessGate,
    noSpecialAccessGateFields,
    noCollectibleGate,
    noCollectibleGateFields,
    noHidden
  } = useAccessAndRemixSettings({
    isUpload,
    isRemix,
    initialStreamConditions,
    isInitiallyUnlisted: initialValues.is_unlisted,
    isScheduledRelease
  })

  const noUsdcGate = noUsdcGateOption || !isUsdcUploadEnabled

  const [availability, setAvailability] =
    useState<TrackAvailabilityType>(initialAvailability)

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
          disabled: noUsdcGate
        }
      : null,
    {
      label: specialAccessAvailability,
      value: specialAccessAvailability,
      disabled: noSpecialAccessGate
    },
    {
      label: collectibleGatedAvailability,
      value: collectibleGatedAvailability,
      disabled: noCollectibleGate
    },
    {
      label: hiddenAvailability,
      value: hiddenAvailability,
      disabled: noHidden
    }
  ].filter(removeNullable)

  const items = {
    [publicAvailability]: (
      <PublicAvailabilityRadioField
        selected={availability === TrackAvailabilityType.PUBLIC}
      />
    )
  }

  if (isUsdcEnabled) {
    items[premiumAvailability] = (
      <PremiumRadioField
        selected={availability === TrackAvailabilityType.USDC_PURCHASE}
        disabled={noUsdcGate}
        disabledContent={noUsdcGate}
        previousStreamConditions={previousStreamConditions}
      />
    )
  }

  items[specialAccessAvailability] = (
    <SpecialAccessAvailability
      selected={availability === TrackAvailabilityType.SPECIAL_ACCESS}
      disabled={noSpecialAccessGate}
      disabledContent={noSpecialAccessGateFields}
      previousStreamConditions={previousStreamConditions}
    />
  )

  items[collectibleGatedAvailability] = (
    <CollectibleGatedAvailability
      selected={availability === TrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={noCollectibleGate}
      disabledContent={noCollectibleGateFields}
      previousStreamConditions={previousStreamConditions}
    />
  )

  items[hiddenAvailability] = (
    <HiddenAvailability
      selected={availability === TrackAvailabilityType.HIDDEN}
      disabled={noHidden}
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
          size='large'
          fullWidth
          title={messages.done}
          onPress={goBack}
          disabled={isFormInvalid}
        />
      }
    />
  )
}
