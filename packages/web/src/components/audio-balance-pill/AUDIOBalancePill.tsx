import { cloneElement } from 'react'

import {
  accountSelectors,
  formatWei,
  isNullOrUndefined,
  useSelectTierInfo,
  useTotalBalanceWithFallback
} from '@audius/common'
import { IconTokenNoTier } from '@audius/harmony'
import BN from 'bn.js'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import Skeleton from 'components/skeleton/Skeleton'
import { audioTierMapSVG } from 'components/user-badges/UserBadges'

import styles from './AUDIOBalancePill.module.css'

const { getAccountUser } = accountSelectors

type AudioPillProps = {
  className?: string
}

export const AudioBalancePill = ({ className }: AudioPillProps) => {
  const account = useSelector(getAccountUser)
  const totalBalance = useTotalBalanceWithFallback()
  const positiveTotalBalance = !isNullOrUndefined(totalBalance)
    ? totalBalance.gt(new BN(0))
    : false

  // we only show the audio balance and respective badge when there is an account
  // so below null-coalescing is okay
  const { tier } = useSelectTierInfo(account?.user_id ?? 0)
  const audioBadge = audioTierMapSVG[tier]

  return (
    <div className={cn(styles.container, className)}>
      {positiveTotalBalance && audioBadge ? (
        cloneElement(audioBadge, {
          height: 20,
          width: 20
        })
      ) : (
        <IconTokenNoTier size='m' />
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
