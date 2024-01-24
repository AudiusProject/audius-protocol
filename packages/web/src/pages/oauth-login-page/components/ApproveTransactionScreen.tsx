import { Flex, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { messages } from '../messages'

import styles from './ApproveTransactionScreen.module.css'

type ApproveTransactionScreenProps = {
  status: 'pending' | 'approved'
}

export const ApproveTransactionScreen = ({
  status
}: ApproveTransactionScreenProps) => (
  <Flex
    h='100%'
    w='100%'
    justifyContent='center'
    alignItems='center'
    direction='column'
    className={styles.wrapper}
    gap='2xl'
    p='xl'
  >
    <LoadingSpinner className={styles.spinner} />
    {status === 'pending' ? (
      <Text variant='body' size='l'>
        {messages.approveTxToConnectProfile}
      </Text>
    ) : null}
  </Flex>
)
