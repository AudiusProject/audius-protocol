import { Flex, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

const messages = {
  transferInProgress: 'Transfer in Progress',
  moment: 'This may take a moment.'
}

export const TransferInProgress = () => {
  return (
    <Flex column gap='xl' alignItems='center' justifyContent='center' h={600}>
      <LoadingSpinner />
      <Flex column gap='s' alignItems='center'>
        <Text variant='heading' size='l'>
          {messages.transferInProgress}
        </Text>
        <Text variant='title' size='l' strength='weak'>
          {messages.moment}
        </Text>
      </Flex>
    </Flex>
  )
}
