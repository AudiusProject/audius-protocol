import { createSelector } from '@reduxjs/toolkit'
import BN from 'bn.js'

import { BNUSDC } from 'models/Wallet'
import { CommonState } from 'store/commonStore'
import { Nullable } from 'utils/typeUtils'
import { stringWeiToBN, zeroBNWei } from 'utils/wallet'

// Previously, the getAccountBalance selector would return different
// values (although numerically the same) because of the return of a
// new BN from inside the stringWeiToBN util function
// Now, we use createSelector to handle returning the same value if
// the balance has not changed.
// We also apply the same logic for getAccountTotalBalance.
const getAccountBalanceStr = (state: CommonState) => {
  return state.wallet.balance
}
export const getAccountBalance = createSelector(
  getAccountBalanceStr,
  (balance) => (balance ? stringWeiToBN(balance) : zeroBNWei)
)

export const getAccountBalanceLoading = (state: CommonState) => {
  return state.wallet.balanceLoading
}

const getAccountTotalBalanceStr = (state: CommonState) =>
  state.wallet.totalBalance

export const getAccountTotalBalance = createSelector(
  getAccountTotalBalanceStr,
  (totalBalance) => (totalBalance ? stringWeiToBN(totalBalance) : zeroBNWei)
)

export const getLocalBalanceDidChange = (state: CommonState): boolean =>
  state.wallet.localBalanceDidChange

export const getFreezeUntilTime = (state: CommonState): Nullable<number> =>
  state.wallet.freezeBalanceUntil

export const getUSDCBalance = (state: CommonState): Nullable<BNUSDC> =>
  state.wallet.usdcBalance ? (new BN(state.wallet.usdcBalance) as BNUSDC) : null
