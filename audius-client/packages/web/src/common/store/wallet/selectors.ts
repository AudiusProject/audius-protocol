import { createSelector } from '@reduxjs/toolkit'

import { StringWei } from 'common/models/Wallet'
import { CommonState } from 'common/store'
import { Nullable } from 'common/utils/typeUtils'
import { stringWeiToBN } from 'common/utils/wallet'

// Previously, the getAccountBalance selector would return different
// values (although numerically the same) because of the return of a
// new BN from inside the stringWeiToBN util function
// Now, we use createSelector to handle returning the same value if
// the balance has not changed.
// We also apply the same logic for getAccountTotalBalance.
const getAccountBalanceStr = (state: CommonState): Nullable<StringWei> => {
  return state.wallet.balance ?? null
}
export const getAccountBalance = createSelector(
  getAccountBalanceStr,
  (balance) => (balance ? stringWeiToBN(balance) : null)
)

const getAccountTotalBalanceStr = (state: CommonState): Nullable<StringWei> =>
  state.wallet.totalBalance ?? null

export const getAccountTotalBalance = createSelector(
  getAccountTotalBalanceStr,
  (totalBalance) => (totalBalance ? stringWeiToBN(totalBalance) : null)
)

export const getLocalBalanceDidChange = (state: CommonState): boolean =>
  state.wallet.localBalanceDidChange

export const getFreezeUntilTime = (state: CommonState): Nullable<number> =>
  state.wallet.freezeBalanceUntil
