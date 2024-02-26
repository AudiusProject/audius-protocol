import React, { ReactNode } from 'react'

import Error from 'components/Error'
import Loading from 'components/Loading'
import Paper from 'components/Paper'

import styles from './Stat.module.css'

type OwnProps = {
  stat: ReactNode
  label: string
  error?: boolean
}

type StatProps = OwnProps

const Stat: React.FC<StatProps> = ({ stat, label, error }) => {
  return (
    <Paper className={styles.container}>
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

export default Stat
