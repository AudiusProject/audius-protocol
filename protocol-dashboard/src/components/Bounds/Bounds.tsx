import React, { ReactNode } from 'react'

import Paper from 'components/Paper'
import styles from './Bounds.module.css'
import { Address } from 'types'
import DisplayAudio from 'components/DisplayAudio'
import { useUser } from 'store/cache/user/hooks'

const messages = {
  minimumTotalStake: 'Min Allowed Stake',
  maximumTotalStake: 'Max Allowed Stake'
}

type RowStatProps = {
  label: string
  value: ReactNode
}
const RowStat: React.FC<RowStatProps> = ({ label, value }) => {
  return (
    <div className={styles.rowContainer}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  )
}

type OwnProps = {
  wallet: Address
}

type BoundsProps = OwnProps

/**
 * Shows stats about staking. Lives on the SP page
 */
const Bounds: React.FC<BoundsProps> = ({ wallet }) => {
  const { user } = useUser({ wallet })
  if (!user || !('serviceProvider' in user)) {
    return null
  }
  const min = <DisplayAudio amount={user.serviceProvider.minAccountStake} />
  const max = <DisplayAudio amount={user.serviceProvider.maxAccountStake} />
  return (
    <Paper className={styles.container}>
      <RowStat label={messages.minimumTotalStake} value={min} />
      <RowStat label={messages.maximumTotalStake} value={max} />
    </Paper>
  )
}

export default Bounds
