import { Flex } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './CoinflowWithdrawPage.module.css'

export const CoinflowWithdrawPage = () => {
  return (
    <Flex direction={'column'}>
      <LoadingSpinner className={styles.spinner} />
    </Flex>
  )
}
