import { useRemixContest } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { Flex } from '@audius/harmony-native'
import { UserGeneratedText } from 'app/components/core'

type Props = {
  trackId: ID
}

/**
 * Tab content displaying prizes for a remix contest
 */
export const RemixContestPrizesTab = ({ trackId }: Props) => {
  const { data: remixContest } = useRemixContest(trackId)

  if (!remixContest) return null

  return (
    <Flex p='xl' pb='2xl' borderTop='default'>
      <UserGeneratedText variant='body' size='l'>
        {remixContest.eventData?.prizeInfo ?? ''}
      </UserGeneratedText>
    </Flex>
  )
}
