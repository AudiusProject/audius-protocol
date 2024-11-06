import { cloneElement } from 'react'

import {
  useSelectTierInfo,
  useTotalBalanceWithFallback
} from '@audius/common/hooks'
import { accountSelectors } from '@audius/common/store'
import { isNullOrUndefined, formatWei } from '@audius/common/utils'
import BN from 'bn.js'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import IconNoTierBadge from 'assets/img/tokenBadgePurple24@2x.webp'
import Skeleton from 'components/skeleton/Skeleton'
import { audioTierMapPng } from 'components/user-badges/UserBadges'

import styles from './AUDIOBalancePill.module.css'

const { getUserId } = accountSelectors

type AudioPillProps = {
  className?: string
}

export const AudioBalancePill = ({ className }: AudioPillProps) => {
  const accountUserId = useSelector(getUserId)
  const totalBalance = useTotalBalanceWithFallback()
  const positiveTotalBalance = !isNullOrUndefined(totalBalance)
    ? totalBalance.gt(new BN(0))
    : false

  // we only show the audio balance and respective badge when there is an account
  // so below null-coalescing is okay
  const { tier } = useSelectTierInfo(accountUserId ?? 0)
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
