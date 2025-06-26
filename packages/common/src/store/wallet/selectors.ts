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

const getAccountTotalBalanceStr = (state: CommonState) =>
  state.wallet.totalBalance

export const getAccountTotalBalance = createSelector(
  getAccountTotalBalanceStr,
  (totalBalance) =>
    !isNullOrUndefined(totalBalance) ? (BigInt(totalBalance) as AudioWei) : null
)
