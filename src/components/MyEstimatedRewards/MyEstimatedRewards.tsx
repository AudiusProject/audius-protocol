import React, { ReactNode } from 'react'
import BN from 'bn.js'

import Paper from 'components/Paper'
import styles from './MyEstimatedRewards.module.css'
import { TICKER } from 'utils/consts'
import { Address, Status } from 'types'
import {
  useUserAnnualRewardRate,
  useUserWeeklyRewards
} from 'store/cache/rewards/hooks'
import Loading from 'components/Loading'
import DisplayAudio from 'components/DisplayAudio'

const messages = {
  staked: `Staked ${TICKER}`,
  estAnnualRewards: 'Est. Annual Reward',
  estWeeklyRewards: 'Est. Weekly Reward'
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

type MyEstimatedRewardsProps = OwnProps

/**
 * Shows stats about staking. Lives on the SP page
 */
const MyEstimatedRewards: React.FC<MyEstimatedRewardsProps> = ({ wallet }) => {
  const weeklyRewards = useUserWeeklyRewards({ wallet })
  const annualRewards = useUserAnnualRewardRate({ wallet })
  const isLoading =
    weeklyRewards.status === Status.Loading ||
    annualRewards.status === Status.Loading
  const annual = <DisplayAudio amount={annualRewards?.reward ?? new BN('0')} />

  const weekly = (
    <DisplayAudio
      amount={'reward' in weeklyRewards ? weeklyRewards.reward : new BN('0')}
    />
  )

  return (
    <Paper className={styles.container}>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <RowStat label={messages.estAnnualRewards} value={annual} />
          <RowStat label={messages.estWeeklyRewards} value={weekly} />
        </>
      )}
    </Paper>
  )
}

export default MyEstimatedRewards
