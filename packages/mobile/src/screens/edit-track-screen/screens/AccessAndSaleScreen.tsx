import { useCallback, useMemo, useState } from 'react'

import type { Nullable, PremiumConditions } from '@audius/common'
import {
  TrackAvailabilityType,
  collectiblesSelectors,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentCollectibleGated,
  FeatureFlags,
  removeNullable
} from '@audius/common'
import { useField, useFormikContext } from 'formik'
import { useSelector } from 'react-redux'

import IconCart from 'app/assets/images/iconCart.svg'
import { Button } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
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

const { getSupportedUserCollections } = collectiblesSelectors

const publicAvailability = TrackAvailabilityType.PUBLIC
const premiumAvailability = TrackAvailabilityType.USDC_PURCHASE
const specialAccessAvailability = TrackAvailabilityType.SPECIAL_ACCESS
const collectibleGatedAvailability = TrackAvailabilityType.COLLECTIBLE_GATED
const hiddenAvailability = TrackAvailabilityType.HIDDEN

const useStyles = makeStyles(({ spacing }) => ({
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
  const navigation = useNavigation()
  const { initialValues } = useFormikContext<FormValues>()
  const [{ value: isPremium }] = useField<boolean>('is_premium')
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

  const { ethCollectionMap, solCollectionMap } = useSelector(
    getSupportedUserCollections
  )
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  const hasNoCollectibles = numEthCollectibles + numSolCollectibles === 0

  const isUpload = !initialValues?.track_id
  const initialPremiumConditions = initialValues?.premium_conditions ?? null
  const initialAvailability = useMemo(() => {
    if ('nft_collection' in (premiumConditions ?? {})) {
      return TrackAvailabilityType.COLLECTIBLE_GATED
    }
    if (isPremium) {
      return TrackAvailabilityType.SPECIAL_ACCESS
    }
    if (isUnlisted) {
      return TrackAvailabilityType.HIDDEN
    }
    return TrackAvailabilityType.PUBLIC
    // we only care about what the initial value was here
    // eslint-disable-next-line
  }, [])

  const isInitiallyPublic =
    !isUpload && !initialValues.is_unlisted && !initialPremiumConditions
  const isInitiallySpecialAccess =
    !isUpload &&
    !!(
      isPremiumContentFollowGated(initialPremiumConditions) ||
      isPremiumContentTipGated(initialPremiumConditions)
    )
  const isInitiallyCollectibleGated =
    !isUpload && isPremiumContentCollectibleGated(initialPremiumConditions)
  const isInitiallyHidden = !isUpload && initialValues.is_unlisted

  const noCollectibleGate =
    isInitiallyPublic ||
    isInitiallySpecialAccess ||
    isRemix ||
    hasNoCollectibles
  const noCollectibleDropdown =
    noCollectibleGate || (!isUpload && !isInitiallyHidden)

  const noSpecialAccess =
    isInitiallyPublic || isInitiallyCollectibleGated || isRemix
  const noSpecialAccessOptions =
    noSpecialAccess || (!isUpload && !isInitiallyHidden)

  const noHidden = !isUpload && !initialValues.is_unlisted

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
          disabled: true
        }
      : null,
    {
      label: specialAccessAvailability,
      value: specialAccessAvailability,
      disabled: noSpecialAccess
    },
    {
      label: collectibleGatedAvailability,
      value: collectibleGatedAvailability,
      disabled: noCollectibleGate
    },
    {
      label: hiddenAvailability,
      value: hiddenAvailability,
      disabled: !isUsdcUploadEnabled
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
        // disabled={!isUsdcUploadEnabled}
        disabledContent={!isUsdcUploadEnabled}
      />
    )
  }

  items[specialAccessAvailability] = (
    <SpecialAccessAvailability
      selected={availability === TrackAvailabilityType.SPECIAL_ACCESS}
      disabled={noSpecialAccess}
      disabledContent={noSpecialAccessOptions}
      previousPremiumConditions={previousPremiumConditions}
    />
  )

  items[collectibleGatedAvailability] = (
    <CollectibleGatedAvailability
      selected={availability === TrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={noCollectibleGate}
      disabledContent={noCollectibleDropdown}
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
   * Only navigate back if:
   * - track is not collectible gated, or
   * - user has selected a collection for this collectible gated track
   */
  const handleSubmit = useCallback(() => {
    if (
      !premiumConditions ||
      !('nft_collection' in premiumConditions) ||
      !!premiumConditions.nft_collection
    ) {
      navigation.goBack()
    }
  }, [premiumConditions, navigation])

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
      header={<MarkedAsRemix />}
      bottomSection={
        <Button
          variant='primary'
          size='large'
          fullWidth
          title={messages.done}
          onPress={handleSubmit}
          disabled={
            !!(
              premiumConditions &&
              'nft_collection' in premiumConditions &&
              !premiumConditions.nft_collection
            )
          }
        />
      }
    />
  )
}
