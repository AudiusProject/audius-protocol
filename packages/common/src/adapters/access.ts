import {
  EthCollectibleGatedConditions,
  full,
  instanceOfFollowGate,
  instanceOfNftGate,
  instanceOfTipGate,
  SolCollectibleGatedConditions,
  TrackMetadata
} from '@audius/sdk'
import { z } from 'zod'

import {
  AccessConditions,
  AccessConditionsEthNFTCollection,
  AccessConditionsSolNFTCollection
} from '~/models'
import { encodeHashId } from '~/utils'

export const accessConditionsFromSDK = (
  input: full.AccessGate
): AccessConditions => {
  if (instanceOfFollowGate(input)) {
    return { follow_user_id: input.followUserId }
  } else if (instanceOfNftGate(input)) {
    return input.nftCollection.chain === full.NftCollectionChainEnum.Eth
      ? {
          nft_collection:
            input.nftCollection as AccessConditionsEthNFTCollection
        }
      : {
          nft_collection:
            input.nftCollection as AccessConditionsSolNFTCollection
        }
  } else if (full.instanceOfPurchaseGate(input)) {
    return { usdc_purchase: input.usdcPurchase }
  } else if (instanceOfTipGate(input)) {
    return { tip_user_id: input.tipUserId }
  } else {
    throw new Error(`Unsupported access gate type: ${input}`)
  }
}
export const accessConditionsToSDK = (
  input: AccessConditions
): TrackMetadata['downloadConditions'] => {
  if ('follow_user_id' in input) {
    return {
      followUserId: encodeHashId(input.follow_user_id)
    }
  } else if ('nft_collection' in input) {
    const collection = input.nft_collection as
      | z.input<typeof EthCollectibleGatedConditions>
      | z.input<typeof SolCollectibleGatedConditions>
    return { nftCollection: collection }
  } else if ('usdc_purchase' in input) {
    return {
      usdcPurchase: input.usdc_purchase
    }
  } else if ('tip_user_id' in input) {
    return {
      tipUserId: encodeHashId(input.tip_user_id)
    }
  } else {
    throw new Error(`Unsupported access conditions type: ${input}`)
  }
}
