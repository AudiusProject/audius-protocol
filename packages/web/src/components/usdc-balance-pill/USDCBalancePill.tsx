import {
  BNUSDC,
  Status,
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  useUSDCBalance
} from '@audius/common'
import { LogoUSDC } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'

import { Icon } from 'components/Icon'
import Skeleton from 'components/skeleton/Skeleton'

import styles from './USDCBalancePill.module.css'

type USDCPillProps = {
  className?: string
}

export const USDCBalancePill = ({ className }: USDCPillProps) => {
  const { data: balance, status: usdcBalanceStatus } = useUSDCBalance()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)

  return (
    <div className={cn(styles.container, className)}>
      <Icon className={styles.icon} icon={LogoUSDC} size='medium' />
      {usdcBalanceStatus === Status.LOADING ? (
        <Skeleton className={styles.skeleton} />
      ) : (
        <span className={styles.amount}>${balanceFormatted}</span>
      )}
    </div>
  )
}
