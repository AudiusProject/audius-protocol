import {
  full,
  instanceOfFollowGate,
  instanceOfNftGate,
  instanceOfTipGate
} from '@audius/sdk'

import {
  AccessConditions,
  AccessConditionsEthNFTCollection,
  AccessConditionsSolNFTCollection
} from '~/models'

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
