import { Box, Flex } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import { Page } from 'components/page/Page'

import { SignatureDecoder } from './components/SignatureDecoder'
import { UserBankAddressDeriver } from './components/UserBankAddressDeriver'
import { messages } from './messages'

export const SolanaToolsPage = () => {
  return (
    <Page
      title={messages.solanaToolsTitle}
      description={messages.solanaToolsDescription}
      header={<Header primary={messages.solanaToolsTitle} showBackButton />}
    >
      <Box p='l'>
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
      </Box>
    </Page>
  )
}

export default SolanaToolsPage
