import { BNWei } from 'common/models/Wallet'
import { CommonState } from 'common/store'
import { Nullable } from 'common/utils/typeUtils'
import { stringWeiToBN } from 'common/utils/wallet'

export const getAccountBalance = (state: CommonState): Nullable<BNWei> => {
  const balance = state.wallet.balance
  if (!balance) return null
  return stringWeiToBN(balance)
}

export const getAccountTotalBalance = (state: CommonState): Nullable<BNWei> => {
  const totalBalance = state.wallet.totalBalance
  if (!totalBalance) return null
  return stringWeiToBN(totalBalance)
}

export const getLocalBalanceDidChange = (state: CommonState): boolean => {
  return state.wallet.localBalanceDidChange
}
