import { useRemixContest } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex } from '@audius/harmony'

import { UserGeneratedText } from 'components/user-generated-text'

type RemixContestPrizesTabProps = {
  trackId: ID
}

/**
 * Tab content displaying prizes for a remix contest
 */
export const RemixContestPrizesTab = ({
  trackId
}: RemixContestPrizesTabProps) => {
  const { data: remixContest } = useRemixContest(trackId)

  return (
    <Flex column gap='l' p='xl'>
      <UserGeneratedText variant='body' size='l'>
        {remixContest?.eventData?.prizeInfo}
      </UserGeneratedText>
    </Flex>
  )
}
