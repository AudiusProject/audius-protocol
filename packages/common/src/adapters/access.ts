import {
  full,
  instanceOfFollowGate,
  instanceOfNftGate,
  instanceOfTipGate
} from '@audius/sdk'
import snakecaseKeys from 'snakecase-keys'

import {
  AccessConditions,
  CollectibleGatedConditions,
  FollowGatedConditions,
  TipGatedConditions,
  USDCPurchaseConditions
} from '~/models'

export const accessConditionsFromSDK = (
  input: full.AccessGate
): AccessConditions => {
  if (instanceOfFollowGate(input)) {
    return snakecaseKeys(input) as FollowGatedConditions
  } else if (instanceOfNftGate(input)) {
    return snakecaseKeys(input) as CollectibleGatedConditions
  } else if (full.instanceOfPurchaseGate(input)) {
    return snakecaseKeys(input) as USDCPurchaseConditions
  } else if (instanceOfTipGate(input)) {
    return snakecaseKeys(input) as TipGatedConditions
  } else {
    throw new Error(`Unsupported access gate type: ${input}`)
  }
}
