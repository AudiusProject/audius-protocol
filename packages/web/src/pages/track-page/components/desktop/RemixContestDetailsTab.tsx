import { useRemixContest } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { dayjs } from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'

const messages = {
  due: 'Submission Due:',
  deadline: (deadline?: string) => {
    if (!deadline) return ''
    const date = dayjs(deadline)
    return `${date.format('ddd. MMM D, YYYY')} at ${date.format('h:mm A')}`
  }
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
  return (
    <Flex column gap='l' p='xl'>
      <Flex row gap='s'>
        <Text variant='title' size='l' color='accent'>
          {messages.due}
        </Text>
        <Text variant='body' size='l' strength='strong'>
          {messages.deadline(remixContest?.endDate)}
        </Text>
      </Flex>
      <Text variant='body' size='l'>
        {
          "Join our exciting remix contest! Showcase your creativity by reimagining your favorite tracks. Submit your remixes for a chance to win amazing prizes and gain recognition in the music community. Don't miss out on this opportunity to shine!"
        }
      </Text>
    </Flex>
  )
}
