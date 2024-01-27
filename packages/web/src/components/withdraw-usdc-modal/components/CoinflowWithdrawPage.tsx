import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import styles from './CoinflowWithdrawPage.module.css'
import { Flex } from '@audius/harmony'

export const CoinflowWithdrawPage = () => {
  return (
    <Flex direction={'column'}>
      <LoadingSpinner className={styles.spinner} />
    </Flex>
  )
}
