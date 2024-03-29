import { useUSDCBalance } from '@audius/common/hooks'
import { Status, BNUSDC } from '@audius/common/models'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber
} from '@audius/common/utils'
import { IconLogoCircleUSDC as LogoUSDC } from '@audius/harmony'
import BN from 'bn.js'
import cn from 'classnames'

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
      <LogoUSDC size='m' className={styles.icon} />
      {usdcBalanceStatus === Status.LOADING ? (
        <Skeleton className={styles.skeleton} />
      ) : (
        <span className={styles.amount}>${balanceFormatted}</span>
      )}
    </div>
  )
}
