import { useMemo } from 'react'

import BN from 'bn.js'
import { useSelector } from 'react-redux'

import { BNWei } from 'models/Wallet'
import { getAccountUser } from 'store/account/selectors'
import { getAccountTotalBalance } from 'store/wallet/selectors'
import { isNullOrUndefined } from 'utils/typeUtils'

/**
 * Pulls balances from account and wallet selectors. Will prefer the wallet
 * balance once it has loaded. Otherwise, will return the account balance if
 * available. Falls back to 0 if neither wallet or account balance are available.
 */
export const useTotalBalanceWithFallback = () => {
  const account = useSelector(getAccountUser)
  const walletTotalBalance = useSelector(getAccountTotalBalance)

  return useMemo(() => {
    if (!isNullOrUndefined(walletTotalBalance)) {
      return walletTotalBalance
    } else if (
      !isNullOrUndefined(account) &&
      !isNullOrUndefined(account.total_balance)
    ) {
      return new BN(account.total_balance) as BNWei
    }

    return null
  }, [account, walletTotalBalance])
}
