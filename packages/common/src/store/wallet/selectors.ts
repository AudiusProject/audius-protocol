import { AudioWei, UsdcWei } from '@audius/fixed-decimal'
import { createSelector } from '@reduxjs/toolkit'

import { CommonState } from '~/store/commonStore'
import { Nullable, isNullOrUndefined } from '~/utils/typeUtils'

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
  (balance) =>
    !isNullOrUndefined(balance) ? (BigInt(balance) as AudioWei) : balance
)

export const getAccountBalanceLoading = (state: CommonState) => {
  return state.wallet.balanceLoading
}

const getAccountTotalBalanceStr = (state: CommonState) =>
  state.wallet.totalBalance

export const getAccountTotalBalance = createSelector(
  getAccountTotalBalanceStr,
  (totalBalance) =>
    !isNullOrUndefined(totalBalance) ? (BigInt(totalBalance) as AudioWei) : null
)

export const getBalanceLoadDidFail = (state: CommonState) =>
  state.wallet.balanceLoadDidFail

export const getTotalBalanceLoadDidFail = (state: CommonState) =>
  state.wallet.totalBalanceLoadDidFail

export const getLocalBalanceDidChange = (state: CommonState): boolean =>
  state.wallet.localBalanceDidChange

export const getFreezeUntilTime = (state: CommonState): Nullable<number> =>
  state.wallet.freezeBalanceUntil

export const getUSDCBalance = (state: CommonState): Nullable<UsdcWei> =>
  state.wallet.usdcBalance
    ? (BigInt(state.wallet.usdcBalance) as UsdcWei)
    : null
