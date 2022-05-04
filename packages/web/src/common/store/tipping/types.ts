import { ID } from 'common/models/Identifiers'
import { Supporter, Supporting } from 'common/models/Tipping'
import { User } from 'common/models/User'
import { BNWei } from 'common/models/Wallet'
import { Nullable } from 'common/utils/typeUtils'

export type TippingSendStatus =
  | 'SEND'
  | 'CONFIRM'
  | 'SENDING'
  | 'SUCCESS'
  | 'ERROR'
export type TippingState = {
  supporters: Record<ID, Supporter[]>
  supporting: Record<ID, Supporting[]>
  send: {
    status: Nullable<TippingSendStatus>
    user: Nullable<User>
    amount: BNWei
    error: Nullable<string>
  }
}
