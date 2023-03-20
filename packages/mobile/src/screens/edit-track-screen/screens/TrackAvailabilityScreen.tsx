import { useCallback, useMemo, useState } from 'react'

import type { Nullable, PremiumConditions } from '@audius/common'
import {
  removeNullable,
  TrackAvailabilityType,
  collectiblesSelectors
} from '@audius/common'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import IconHidden from 'app/assets/images/iconHidden.svg'
import { Button } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useIsCollectibleGatedEnabled } from 'app/hooks/useIsCollectibleGatedEnabled'
import { useIsSpecialAccessEnabled } from 'app/hooks/useIsSpecialAccessEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { CollectibleGatedAvailability } from '../components/CollectibleGatedAvailability'
import { HiddenAvailability } from '../components/HiddenAvailability'
import { PublicAvailability } from '../components/PublicAvailability'
import { SpecialAccessAvailability } from '../components/SpecialAccessAvailability'
import type { RemixOfField } from '../types'

import type { ListSelectionData } from './ListSelectionScreen'
import { ListSelectionScreen } from './ListSelectionScreen'

const messages = {
  title: 'Availability',
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

export const TrackAvailabilityScreen = () => {
  const isSpecialAccessEnabled = useIsSpecialAccessEnabled()
  const isCollectibleGatedEnabled = useIsCollectibleGatedEnabled()

  const navigation = useNavigation()
  const [{ value: isPremium }] = useField<boolean>('is_premium')
  const [{ value: premiumConditions }] =
    useField<Nullable<PremiumConditions>>('premium_conditions')
  const [{ value: isUnlisted }] = useField<boolean>('is_unlisted')
  const [{ value: remixOf }] = useField<RemixOfField>('remix_of')
  const isRemix = !!remixOf
  const [{ value: trackId }] = useField<boolean>('track_id')
  const isUpload = !trackId

  const { ethCollectionMap, solCollectionMap } = useSelector(
    getSupportedUserCollections
  )
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  const hasNoCollectibles = numEthCollectibles + numSolCollectibles === 0

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

  // we only care about what the initial value was here
  // eslint-disable-next-line
  const initialPremiumConditions = useMemo(() => premiumConditions, [])

  const isInitiallySpecialAccess =
    !isUpload && initialAvailability === TrackAvailabilityType.SPECIAL_ACCESS
  const noCollectibleGate =
    isInitiallySpecialAccess || isRemix || hasNoCollectibles
  const noCollectibleDropdown = isInitiallySpecialAccess || !isUpload

  const isInitiallyCollectibleGated =
    !isUpload && initialAvailability === TrackAvailabilityType.COLLECTIBLE_GATED
  const noSpecialAccess = isInitiallyCollectibleGated || isRemix
  const noSpecialAccessOptions = noSpecialAccess || !isUpload

  const noHidden =
    !isUpload && initialAvailability !== TrackAvailabilityType.HIDDEN

  const [availability, setAvailability] =
    useState<TrackAvailabilityType>(initialAvailability)

  const data: ListSelectionData[] = [
    { label: publicAvailability, value: publicAvailability },
    isSpecialAccessEnabled
      ? {
          label: specialAccessAvailability,
          value: specialAccessAvailability,
          disabled: noSpecialAccess
        }
      : null,
    isCollectibleGatedEnabled
      ? {
          label: collectibleGatedAvailability,
          value: collectibleGatedAvailability,
          disabled: noCollectibleGate
        }
      : null,
    { label: hiddenAvailability, value: hiddenAvailability, disabled: noHidden }
  ].filter(removeNullable)

  const items = {
    [publicAvailability]: (
      <PublicAvailability
        selected={availability === TrackAvailabilityType.PUBLIC}
      />
    )
  }
  if (isSpecialAccessEnabled) {
    items[specialAccessAvailability] = (
      <SpecialAccessAvailability
        selected={availability === TrackAvailabilityType.SPECIAL_ACCESS}
        disabled={noSpecialAccess}
        disabledContent={noSpecialAccessOptions}
        initialPremiumConditions={initialPremiumConditions}
      />
    )
  }
  if (isCollectibleGatedEnabled) {
    items[collectibleGatedAvailability] = (
      <CollectibleGatedAvailability
        selected={availability === TrackAvailabilityType.COLLECTIBLE_GATED}
        disabled={noCollectibleGate}
        disabledContent={noCollectibleDropdown}
        initialPremiumConditions={initialPremiumConditions}
      />
    )
  }
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
      icon={IconHidden}
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
