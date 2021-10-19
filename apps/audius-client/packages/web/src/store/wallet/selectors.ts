import { Nullable } from 'common/utils/typeUtils'
import { AppState } from 'store/types'
import { stringWeiToBN } from 'utils/wallet'

import { BNWei } from '../../common/models/Wallet'

// Selectors
export const getAccountBalance = (state: AppState): Nullable<BNWei> => {
  const balance = state.wallet.balance
  if (!balance) return null
  return stringWeiToBN(balance)
}

export const getAccountTotalBalance = (state: AppState): Nullable<BNWei> => {
  const totalBalance = state.wallet.totalBalance
  if (!totalBalance) return null
  return stringWeiToBN(totalBalance)
}
export const getLocalBalanceDidChange = (state: AppState): boolean => {
  return state.wallet.localBalanceDidChange
}
