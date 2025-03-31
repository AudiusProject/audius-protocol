import type { TrackMetadata } from '@audius/sdk'
import {
  EthCollectibleGatedConditions,
  SolCollectibleGatedConditions
} from '@audius/sdk'
import { z } from 'zod'

import {
  AccessConditions,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '~/models'

export const accessConditionsToSDK = (
  input: AccessConditions
): TrackMetadata['downloadConditions'] => {
  if (isContentFollowGated(input)) {
    return {
      followUserId: input.follow_user_id
    }
  } else if (isContentCollectibleGated(input)) {
    const collection = input.nft_collection as
      | z.input<typeof EthCollectibleGatedConditions>
      | z.input<typeof SolCollectibleGatedConditions>
    return { nftCollection: collection }
  } else if (isContentUSDCPurchaseGated(input)) {
    return {
      usdcPurchase: input.usdc_purchase
    }
  } else if (isContentTipGated(input)) {
    return {
      tipUserId: input.tip_user_id
    }
  } else {
    throw new Error(
      `Unsupported access conditions type: ${JSON.stringify(input)}`
    )
  }
}
