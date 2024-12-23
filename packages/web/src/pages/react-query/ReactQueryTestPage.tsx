import { Flex } from '@audius/harmony'

import { TestCollection } from './components/TestCollection'
import { TestCollectionUpdate } from './components/TestCollectionUpdate'
import { TestTrack } from './components/TestTrack'
import { TestTrackUpdate } from './components/TestTrackUpdate'
import { TestUser } from './components/TestUser'
import { TestUserUpdate } from './components/TestUserUpdate'

export const ReactQueryTestPage = () => {
  // D809W -> 1234
  // 51Aq2 -> 1647
  // G0oJXEw -> 11845
  // 0RZ0OKK -> 9876
  const userId1 = 1234
  const userId2 = 1647
  const trackId = 11845
  const playlistId = 9876

  return (
    <Flex direction='column' gap='xl' p='2xl'>
      <TestUser userId={userId1} />
      <TestUserUpdate userId={userId2} />
      <TestTrack trackId={trackId} />
      <TestTrackUpdate trackId={trackId} />
      <TestCollection playlistId={playlistId} />
      <TestCollectionUpdate playlistId={playlistId} />
    </Flex>
  )
}

export default ReactQueryTestPage
