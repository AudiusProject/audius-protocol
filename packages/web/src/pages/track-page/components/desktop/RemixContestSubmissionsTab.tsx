import { ID } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'

const messages = {
  noSubmissions: 'No submissions yet',
  beFirst: 'Be the first to upload a remix!'
}

type RemixContestSubmissionsTabProps = {
  trackId: ID
}

/**
 * Tab content displaying submissions for a remix contest
 */
export const RemixContestSubmissionsTab = ({
  trackId
}: RemixContestSubmissionsTabProps) => {
  return <EmptyRemixContestSubmissions />
}

const EmptyRemixContestSubmissions = () => {
  return (
    <Flex
      column
      w='100%'
      pv='3xl'
      gap='m'
      justifyContent='center'
      alignItems='center'
    >
      <Text variant='heading' size='s'>
        {messages.noSubmissions}
      </Text>
      <Text variant='body' size='l' color='subdued'>
        {messages.beFirst}
      </Text>
    </Flex>
  )
}
