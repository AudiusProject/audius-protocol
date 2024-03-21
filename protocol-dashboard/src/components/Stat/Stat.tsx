import React, { ReactNode } from 'react'

import Paper from 'components/Paper'
import { Text, TextProps } from '@audius/harmony'
import styles from './Stat.module.css'
import Loading from 'components/Loading'
import Error from 'components/Error'

type OwnProps = {
  stat: ReactNode
  label?: string
  error?: boolean
}

type StatProps = OwnProps & TextProps

const Stat: React.FC<StatProps> = ({ stat, label, error, ...textProps }) => {
  return (
    <Paper className={styles.container}>
      {error ? (
        <div className={styles.status}>
          <Error />
        </div>
      ) : stat !== null ? (
        <Text css={{ marginTop: 0, marginBottom: 0 }} {...textProps}>
          {stat}
        </Text>
      ) : (
        <div className={styles.loadingContainer}>
          <Loading className={styles.loading} />
        </div>
      )}
    </Paper>
  )
}

export default Stat
