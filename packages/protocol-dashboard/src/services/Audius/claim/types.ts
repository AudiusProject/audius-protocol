import { Address } from 'types'
import BN from 'bn.js'

export type GetClaimProcessedResponse = {
  blockNumber: number
  claimer: Address
  rewards: BN
  oldTotal: BN
  newTotal: BN
}
