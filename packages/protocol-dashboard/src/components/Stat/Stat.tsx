import React, { ReactNode } from 'react'

import { Flex, Text, TextProps } from '@audius/harmony'

import Error from 'components/Error'
import Loading from 'components/Loading'

import styles from './Stat.module.css'

type OwnProps = {
  stat: ReactNode
  label?: string
  error?: boolean
}

type StatProps = OwnProps & TextProps

const Stat: React.FC<StatProps> = ({ stat, label, error, ...textProps }) => {
  return (
    <Flex className={styles.container}>
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
    </Flex>
  )
}

export default Stat
