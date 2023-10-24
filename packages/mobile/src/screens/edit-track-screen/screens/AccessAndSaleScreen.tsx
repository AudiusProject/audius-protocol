import { useCallback, useMemo, useState } from 'react'

import type { Nullable, PremiumConditions } from '@audius/common'
import {
  TrackAvailabilityType,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentCollectibleGated,
  FeatureFlags,
  removeNullable,
  isPremiumContentUSDCPurchaseGated,
  useAccessAndRemixSettings,
  useUSDCPurchaseConfig
} from '@audius/common'
import { useField, useFormikContext } from 'formik'

import IconCaretLeft from 'app/assets/images/iconCaretLeft.svg'
import IconCart from 'app/assets/images/iconCart.svg'
import { Button } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag, useRemoteVar } from 'app/hooks/useRemoteConfig'
import { TopBarIconButton } from 'app/screens/app-screen'
import { makeStyles } from 'app/styles'

import { CollectibleGatedAvailability } from '../components/CollectibleGatedAvailability'
import { HiddenAvailability } from '../components/HiddenAvailability'
import { SpecialAccessAvailability } from '../components/SpecialAccessAvailability'
import { PremiumRadioField } from '../fields/AccessAndSaleField/PremiumRadioField/PremiumRadioField'
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
  const [{ value: premiumConditions }] =
    useField<Nullable<PremiumConditions>>('premium_conditions')
  const [{ value: isUnlisted }] = useField<boolean>('is_unlisted')
  const [{ value: remixOf }] = useField<RemixOfField>('remix_of')
  const isRemix = !!remixOf

  const { isEnabled: isUsdcEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )

  const isUpload = !initialValues?.track_id
  const initialPremiumConditions = initialValues?.premium_conditions ?? null
  const initialAvailability = useMemo(() => {
    if (isUsdcEnabled && isPremiumContentUSDCPurchaseGated(premiumConditions)) {
      return TrackAvailabilityType.USDC_PURCHASE
    }
    if (isPremiumContentCollectibleGated(premiumConditions)) {
      return TrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (
      isPremiumContentFollowGated(premiumConditions) ||
      isPremiumContentTipGated(premiumConditions)
    ) {
      return TrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isUnlisted) {
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
    initialPremiumConditions,
    isInitiallyUnlisted: initialValues.is_unlisted
  })

  const noUsdcGate = noUsdcGateOption || !isUsdcUploadEnabled

  const [availability, setAvailability] =
    useState<TrackAvailabilityType>(initialAvailability)

  const previousPremiumConditions = useMemo(
    () => premiumConditions ?? initialPremiumConditions,
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
        previousPremiumConditions={previousPremiumConditions}
      />
    )
  }

  items[specialAccessAvailability] = (
    <SpecialAccessAvailability
      selected={availability === TrackAvailabilityType.SPECIAL_ACCESS}
      disabled={noSpecialAccessGate}
      disabledContent={noSpecialAccessGateFields}
      previousPremiumConditions={previousPremiumConditions}
    />
  )

  items[collectibleGatedAvailability] = (
    <CollectibleGatedAvailability
      selected={availability === TrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={noCollectibleGate}
      disabledContent={noCollectibleGateFields}
      previousPremiumConditions={previousPremiumConditions}
    />
  )

  items[hiddenAvailability] = (
    <HiddenAvailability
      selected={availability === TrackAvailabilityType.HIDDEN}
      disabled={noHidden}
    />
  )

  /**
   * Do not navigate back if:
   * - track is collectible gated and user has not selected an nft collection, or
   * - track is usdc purchase gated and user has not selected a valid price
   */
  const { minContentPriceCents, maxContentPriceCents } =
    useUSDCPurchaseConfig(useRemoteVar)
  const usdcGateHasInvalidPrice = useMemo(() => {
    return (
      isPremiumContentUSDCPurchaseGated(premiumConditions) &&
      (premiumConditions.usdc_purchase.price < minContentPriceCents / 100 ||
        premiumConditions.usdc_purchase.price > maxContentPriceCents / 100)
    )
  }, [premiumConditions, minContentPriceCents, maxContentPriceCents])
  const collectibleGateHasNoSelectedCollection = useMemo(() => {
    return (
      isPremiumContentCollectibleGated(premiumConditions) &&
      !premiumConditions.nft_collection
    )
  }, [premiumConditions])
  const isFormInvalid =
    usdcGateHasInvalidPrice || collectibleGateHasNoSelectedCollection

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
          onPress={() => {
            if (!isFormInvalid) goBack()
          }}
        />
      }
      header={<MarkedAsRemix />}
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
