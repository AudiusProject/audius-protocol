import { useRemixContest } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { dayjs } from '@audius/common/utils'

import { Flex, Text } from '@audius/harmony-native'
import { UserGeneratedText } from 'app/components/core'

const messages = {
  due: 'Submission Due:',
  deadline: (deadline?: string) => {
    if (!deadline) return ''
    const date = dayjs(deadline)
    return `${date.format('MM/DD/YY')} at ${date.format('h:mm A')}`
  },
  fallbackDescription:
    'Enter my remix contest before the deadline for your chance to win!'
}

type Props = {
  trackId: ID
}

/**
 * Tab content displaying details about a remix contest
 */
export const RemixContestDetailsTab = ({ trackId }: Props) => {
  const { data: remixContest } = useRemixContest(trackId)

  if (!remixContest) return null

  return (
    <Flex column gap='s' p='xl'>
      <Flex row gap='s'>
        <Text variant='title' color='accent'>
          {messages.due}
        </Text>
        <Text variant='body' strength='strong'>
          {messages.deadline(remixContest?.endDate)}
        </Text>
      </Flex>
      <UserGeneratedText variant='body'>
        {remixContest?.eventData?.description ?? messages.fallbackDescription}
      </UserGeneratedText>
    </Flex>
  )
}
