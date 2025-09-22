import { useState } from 'react'

import { ID } from '@audius/common/models'
import { Box, Flex } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import { Page } from 'components/page/Page'

import { UserIdParser } from './components/UserIdParser'
import { UserInfo } from './components/UserInfo'
import { messages } from './messages'

export const UserIdParserPage = () => {
  const [parsedUserId, setParsedUserId] = useState<ID | null>(null)

  const handleParsedIdChange = (id: number | null) => {
    setParsedUserId(id)
  }

  return (
    <Page
      title={messages.userIdParserTitle}
      description={messages.userIdParserDescription}
      header={<Header primary={messages.userIdParserTitle} showBackButton />}
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
          <UserIdParser onParsedIdChange={handleParsedIdChange} />
          <UserInfo userId={parsedUserId} />
        </Flex>
      </Box>
    </Page>
  )
}

export default UserIdParserPage
