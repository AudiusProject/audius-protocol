import { useState } from 'react'

import { Button, Flex } from '@audius/harmony'

import { TestTrack } from './components/TestTrack'
import { TestUser } from './components/TestUser'

export const ReactQueryCachePrimePage = () => {
  const [showUser, setShowUser] = useState(false)

  return (
    <Flex direction='column' gap='xl' p='2xl'>
      <TestTrack trackId='G0oJXEw' />
      <Button onClick={() => setShowUser(true)} disabled={showUser}>
        Show User Component
      </Button>
      {showUser && <TestUser userId='51Aq2' />}
    </Flex>
  )
}

export default ReactQueryCachePrimePage
