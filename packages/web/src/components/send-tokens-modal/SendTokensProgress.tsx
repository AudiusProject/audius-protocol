import { Text, Flex, LoadingSpinner } from '@audius/harmony'

const messages = {
  transactionInProgress: 'Transaction in Progress',
  description: 'This may take a moment.'
}

const SendTokensProgress = () => {
  return (
    <Flex
      direction='column'
      gap='xl'
      p='xl'
      alignItems='center'
      justifyContent='center'
      css={{ minHeight: 600 }}
    >
      {/* Loading Spinner */}
      <LoadingSpinner size='2xl' color='subdued' />

      {/* Status Text */}
      <Flex direction='column' gap='s' alignItems='center'>
        <Text variant='heading' size='l' color='default'>
          {messages.transactionInProgress}
        </Text>
        <Text variant='title' size='l' strength='weak'>
          {messages.description}
        </Text>
      </Flex>
    </Flex>
  )
}

export default SendTokensProgress
