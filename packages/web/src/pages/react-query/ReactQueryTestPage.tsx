import { Flex } from '@audius/harmony'

import { TestCollection } from './components/TestCollection'
import { TestCollectionUpdate } from './components/TestCollectionUpdate'
import { TestTrack } from './components/TestTrack'
import { TestTrackUpdate } from './components/TestTrackUpdate'
import { TestUser } from './components/TestUser'
import { TestUserUpdate } from './components/TestUserUpdate'

export const ReactQueryTestPage = () => {
  return (
    <Flex direction='column' gap='xl' p='2xl'>
      <TestUser userId='D809W' />
      <TestUserUpdate userId='51Aq2' />
      <TestTrack trackId='G0oJXEw' />
      <TestTrackUpdate trackId='G0oJXEw' />
      <TestCollection playlistId='0RZ0OKK' />
      <TestCollectionUpdate playlistId='0RZ0OKK' />
    </Flex>
  )
}

export default ReactQueryTestPage
