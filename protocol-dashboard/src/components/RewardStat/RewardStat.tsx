import React, { ReactNode } from 'react'

import clsx from 'clsx'

import Error from 'components/Error'
import Loading from 'components/Loading'
import Paper from 'components/Paper'

import styles from './RewardStat.module.css'

type OwnProps = {
  className?: string
  stat: ReactNode
  label: string
  error?: boolean
}

type RewardStatProps = OwnProps

const RewardStat: React.FC<RewardStatProps> = ({
  className,
  stat,
  label,
  error
}) => {
  return (
    <Paper className={clsx(styles.container, { [className!]: className })}>
      {error ? (
        <div className={styles.stat}>
          <Error />
        </div>
      ) : stat !== null ? (
        <div className={styles.stat}>{stat}</div>
      ) : (
        <div className={styles.loadingContainer}>
          <Loading className={styles.loading} />
        </div>
      )}
      <div className={styles.label}>{label}</div>
    </Paper>
  )
}

export default RewardStat
