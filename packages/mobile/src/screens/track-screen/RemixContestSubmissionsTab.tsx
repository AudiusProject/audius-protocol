import { useRemixContest } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { Flex, Text } from '@audius/harmony-native'

type Props = {
  trackId: ID
}

/**
 * Tab content displaying submissions for a remix contest
 */
export const RemixContestSubmissionsTab = ({ trackId }: Props) => {
  const { data: remixContest } = useRemixContest(trackId)

  if (!remixContest) return null

  return (
    <Flex p='xl'>
      <Text variant='body' size='l'>
        {/* TODO: Implement submissions content */}
      </Text>
    </Flex>
  )
}
