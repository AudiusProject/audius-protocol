import { useMemo } from 'react'

import {
  isContentFollowGated,
  type FieldVisibility,
  type Nullable,
  type StreamConditions,
  isContentTipGated,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated
} from '@audius/common'
import { useField } from 'formik'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

export const accessAndSaleScreenName = 'AccessAndSale'

const messages = {
  accessAndSale: 'Access & Sale',
  public: 'Public',
  premium: 'Premium',
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  followersOnly: 'Followers Only',
  supportersOnly: 'Supporters Only',
  hidden: 'Hidden',
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count'
}

const fieldVisibilityLabelMap = {
  genre: messages.showGenre,
  mood: messages.showMood,
  tags: messages.showTags,
  share: messages.showShareButton,
  play_count: messages.showPlayCount
}

const fieldVisibilityKeys = Object.keys(fieldVisibilityLabelMap)

type AccessAndSaleFieldProps = Partial<ContextualMenuProps>

export const AccessAndSaleField = (props: AccessAndSaleFieldProps) => {
  const [{ value: streamConditions }] =
    useField<Nullable<StreamConditions>>('stream_conditions')
  const [{ value: isUnlisted }] = useField<boolean>('is_unlisted')
  const [{ value: isScheduledRelease }] = useField<boolean>(
    'is_scheduled_release'
  )

  const [{ value: fieldVisibility }] =
    useField<FieldVisibility>('field_visibility')

  const fieldVisibilityLabels = fieldVisibilityKeys
    .filter((visibilityKey) => fieldVisibility[visibilityKey])
    .map((visibilityKey) => fieldVisibilityLabelMap[visibilityKey])

  const trackAvailabilityLabels = useMemo(() => {
    if (isContentUSDCPurchaseGated(streamConditions)) {
      const amountLabel = `$${streamConditions.usdc_purchase.price}`
      return [messages.premium, amountLabel]
    }
    if (isContentCollectibleGated(streamConditions)) {
      return [messages.collectibleGated]
    }
    if (isContentFollowGated(streamConditions)) {
      return [messages.specialAccess, messages.followersOnly]
    }
    if (isContentTipGated(streamConditions)) {
      return [messages.specialAccess, messages.supportersOnly]
    }
    if (isUnlisted && !isScheduledRelease) {
      return [messages.hidden, ...fieldVisibilityLabels]
    }
    return [messages.public]
  }, [streamConditions, isUnlisted, fieldVisibilityLabels, isScheduledRelease])

  return (
    <ContextualMenu
      label={messages.accessAndSale}
      menuScreenName={accessAndSaleScreenName}
      value={trackAvailabilityLabels}
      {...props}
    />
  )
}
