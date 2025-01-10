import { useState } from 'react'

import { Button, Flex } from '@audius/harmony'

import { TestTrack } from './components/TestTrack'
import { TestUser } from './components/TestUser'

const ReactQueryCachePrimePage = () => {
  const [showUser, setShowUser] = useState(false)

  // G0oJXEw -> 11845
  // 51Aq2 -> 1647
  const trackId = 11845
  const userId = 1647

  return (
    <Flex direction='column' gap='xl' p='2xl'>
      <TestTrack trackId={trackId} />
      <Button onClick={() => setShowUser(true)} disabled={showUser}>
        Show User Component
      </Button>
      {showUser && <TestUser userId={userId} />}
    </Flex>
  )
}

export default ReactQueryCachePrimePage
