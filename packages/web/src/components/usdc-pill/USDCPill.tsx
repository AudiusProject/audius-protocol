import { LogoUSDC } from '@audius/stems'
import cn from 'classnames'

import { Icon } from 'components/Icon'
import Skeleton from 'components/skeleton/Skeleton'

import styles from './USDCPill.module.css'

type USDCPillProps = {
  isLoading: boolean
  balance: string
  className?: string
}

export const USDCPill = ({ isLoading, balance, className }: USDCPillProps) => {
  return (
    <div className={cn(styles.container, className)}>
      <Icon className={styles.icon} icon={LogoUSDC} size='medium' />
      {isLoading ? (
        <Skeleton className={styles.skeleton} />
      ) : (
        <span className={styles.amount}>${balance}</span>
      )}
    </div>
  )
}
