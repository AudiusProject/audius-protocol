import BN from 'bn.js'

import { Address } from 'types'

export type GetClaimProcessedResponse = {
  blockNumber: number
  claimer: Address
  rewards: BN
  oldTotal: BN
  newTotal: BN
}
