import { ID } from './Identifiers'
import { StringWei } from './Wallet'

export type Supporter = {
  sender_id: ID
  amount: StringWei
  rank: number
}

export type Supporting = {
  receiver_id: ID
  amount: StringWei
  rank: number
}
