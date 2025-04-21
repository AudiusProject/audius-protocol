import { ID } from '@audius/common/models'
import { Text, Flex } from '@audius/harmony'

type RemixContestPrizesTabProps = {
  trackId: ID
}

/**
 * Tab content displaying prizes for a remix contest
 */
export const RemixContestPrizesTab = ({
  trackId
}: RemixContestPrizesTabProps) => {
  return (
    <Flex column gap='l' p='xl'>
      <Text variant='body' size='l'>
        {'Best Remix Award - $500'}
      </Text>
      <Text variant='body' size='l'>
        {'Audience Choice Award - $300'}
      </Text>
      <Text variant='body' size='l'>
        {'Most Creative Remix - $200'}
      </Text>
      <Text variant='body' size='l'>
        {'Best Use of Original Material - $250'}
      </Text>
      <Text variant='body' size='l'>
        {'Rising Star Award - $150'}
      </Text>
      <Text variant='body' size='l'>
        {'Honorable Mention - $100'}
      </Text>
    </Flex>
  )
}
