import { cloneElement } from 'react'

import { accountSelectors, formatWei, isNullOrUndefined } from '@audius/common'
import {
  useSelectTierInfo,
  useTotalBalanceWithFallback
} from '@audius/common/hooks'
import BN from 'bn.js'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import IconNoTierBadge from 'assets/img/tokenBadgeNoTier.png'
import Skeleton from 'components/skeleton/Skeleton'
import { audioTierMapPng } from 'components/user-badges/UserBadges'

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
  const audioBadge = audioTierMapPng[tier]

  return (
    <div className={cn(styles.container, className)}>
      {positiveTotalBalance && audioBadge ? (
        cloneElement(audioBadge, {
          height: 20,
          width: 20
        })
      ) : (
        <img alt='no tier' src={IconNoTierBadge} width='20' height='20' />
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
