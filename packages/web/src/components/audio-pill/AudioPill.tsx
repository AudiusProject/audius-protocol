import { cloneElement, useMemo } from 'react'

import {
  BNWei,
  accountSelectors,
  formatWei,
  isNullOrUndefined,
  useSelectTierInfo,
  walletSelectors
} from '@audius/common'
import BN from 'bn.js'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import IconNoTierBadge from 'assets/img/tokenBadgeNoTier.png'
import Skeleton from 'components/skeleton/Skeleton'
import { audioTierMapPng } from 'components/user-badges/UserBadges'

import styles from './AudioPill.module.css'

const { getAccountUser } = accountSelectors
const { getAccountTotalBalance } = walletSelectors

type USDCPillProps = {
  isLoading: boolean
  balance: string
  className?: string
}

/**
 * Pulls balances from account and wallet selectors. Will prefer the wallet
 * balance once it has loaded. Otherwise, will return the account balance if
 * available. Falls back to 0 if neither wallet or account balance are available.
 */
const useTotalBalanceWithFallback = () => {
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

export const AudioPill = ({ isLoading, balance, className }: USDCPillProps) => {
  const account = useSelector(getAccountUser)
  const totalBalance = useTotalBalanceWithFallback()
  const positiveTotalBalance = !isNullOrUndefined(totalBalance)
    ? totalBalance.gt(new BN(0))
    : false

  // we only show the audio balance and respective badge when there is an account
  // so below null-coalescing is okay
  const { tier } = useSelectTierInfo(account?.user_id ?? 0)
  const audioBadge = audioTierMapPng[tier]

  return (
    <div className={cn(styles.container, className)}>
      {positiveTotalBalance && audioBadge ? (
        cloneElement(audioBadge, {
          height: 16,
          width: 16
        })
      ) : (
        <img alt='no tier' src={IconNoTierBadge} width='16' height='16' />
      )}
      {isNullOrUndefined(totalBalance) ? (
        <Skeleton className={styles.skeleton} />
      ) : (
        <span className={styles.amount}>
          {formatWei(totalBalance, true, 0)}
        </span>
      )}
    </div>
  )
}
