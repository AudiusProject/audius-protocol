import { useRemixContest } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { dayjs } from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'

import { UserGeneratedText } from 'components/user-generated-text'

const messages = {
  due: 'Submission Due:',
  deadline: (deadline?: string) => {
    if (!deadline) return ''
    const date = dayjs(deadline)
    return `${date.format('ddd. MMM D, YYYY')} at ${date.format('h:mm A')}`
  },
  ended: 'Contest Ended'
}

type RemixContestDetailsTabProps = {
  trackId: ID
}

/**
 * Tab content displaying details about a remix contest
 */
export const RemixContestDetailsTab = ({
  trackId
}: RemixContestDetailsTabProps) => {
  const { data: remixContest } = useRemixContest(trackId)
  const isContestEnded = dayjs(remixContest?.endDate).isBefore(dayjs())

  return (
    <Flex column gap='l' p='xl'>
      <Flex row gap='s'>
        <Text variant='title' size='l' color='accent'>
          {messages.due}
        </Text>
        <Text variant='body' size='l' strength='strong'>
          {isContestEnded
            ? messages.ended
            : messages.deadline(remixContest?.endDate)}
        </Text>
      </Flex>
      <UserGeneratedText variant='body' size='l'>
        {remixContest?.eventData?.description}
      </UserGeneratedText>
    </Flex>
  )
}
