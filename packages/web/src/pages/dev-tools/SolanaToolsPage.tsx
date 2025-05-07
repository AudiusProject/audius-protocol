import { Box, Flex, Text } from '@audius/harmony'

import { SignatureDecoder } from './components/SignatureDecoder'
import { UserBankAddressDeriver } from './components/UserBankAddressDeriver'
import { messages } from './messages'

export const SolanaToolsPage = () => {
  return (
    <Box p='l'>
      <Flex direction='column' gap='xl' alignItems='flex-start'>
        <Flex
          direction='column'
          gap='s'
          css={{ marginBottom: 'var(--harmony-spacing-l)' }}
        >
          <Text variant='display' size='l' tag='h1'>
            {messages.solanaToolsTitle}
          </Text>
          <Text variant='body' size='l'>
            {messages.solanaToolsDescription}
          </Text>
        </Flex>
        <Flex
          direction='row'
          wrap='wrap'
          gap='xl'
          justifyContent='flex-start'
          css={{
            width: '100%'
          }}
        >
          <SignatureDecoder />
          <UserBankAddressDeriver />
        </Flex>
      </Flex>
    </Box>
  )
}

export default SolanaToolsPage
