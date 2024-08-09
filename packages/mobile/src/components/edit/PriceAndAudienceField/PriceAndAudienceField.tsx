import { useMemo } from 'react'

import { priceAndAudienceMessages as messages } from '@audius/common/messages'
import type { AccessConditions } from '@audius/common/models'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import {
  decimalIntegerToHumanReadable,
  type Nullable
} from '@audius/common/utils'
import { useField } from 'formik'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

export const priceAndAudienceScreenName = 'PriceAndAudience'

type PriceAndAudienceFieldProps = Partial<ContextualMenuProps>

export const PriceAndAudienceField = (props: PriceAndAudienceFieldProps) => {
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')

  const trackAvailabilityLabels = useMemo(() => {
    if (isContentUSDCPurchaseGated(streamConditions)) {
      const amountLabel = `$${decimalIntegerToHumanReadable(
        streamConditions.usdc_purchase.price
      )}`
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
    return [messages.free]
  }, [streamConditions])

  return (
    <ContextualMenu
      label={messages.title}
      menuScreenName={priceAndAudienceScreenName}
      value={trackAvailabilityLabels}
      {...props}
    />
  )
}
