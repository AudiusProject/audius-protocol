import { useMemo } from 'react'

import BN from 'bn.js'
import { useSelector } from 'react-redux'

import { useCurrentAccountUser } from '~/api'
import { BNWei } from '~/models/Wallet'
import { getAccountTotalBalance } from '~/store/wallet/selectors'
import { isNullOrUndefined } from '~/utils/typeUtils'

/**
 * Pulls balances from account and wallet selectors. Will prefer the wallet
 * balance once it has loaded. Otherwise, will return the account balance if
 * available. Falls back to null if neither wallet or account balance are available.
 */
export const useTotalBalanceWithFallback = () => {
  const { data: totalBalance } = useCurrentAccountUser({
    select: (user) => user?.total_balance
  })
  const walletTotalBalance = useSelector(getAccountTotalBalance)

  return useMemo(() => {
    if (!isNullOrUndefined(walletTotalBalance)) {
      return walletTotalBalance
    } else if (!isNullOrUndefined(totalBalance)) {
      return new BN(totalBalance) as BNWei
    }

    return null
  }, [totalBalance, walletTotalBalance])
}
