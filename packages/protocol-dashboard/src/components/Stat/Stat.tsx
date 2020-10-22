import React, { ReactNode } from 'react'

import Paper from 'components/Paper'
import styles from './Stat.module.css'
import Loading from 'components/Loading'

type OwnProps = {
  stat: ReactNode
  label: string
}

type StatProps = OwnProps

const Stat: React.FC<StatProps> = ({ stat, label }) => {
  return (
    <Paper className={styles.container}>
      {stat !== null ? (
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

export default Stat
