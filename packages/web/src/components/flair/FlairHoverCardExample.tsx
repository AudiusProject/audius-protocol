import {
  Text,
  Flex,
  IconTokenBronze,
  FlairHoverCard,
  IconLogoCircle
} from '@audius/harmony'

import { AudioTierFlairHoverCardHeader } from './AudioTierFlairHoverCardHeader'
import { FlairHoverCardBody } from './FlairHoverCardBody'

export const FlairHoverCardExample = () => {
  return (
    <Flex direction='column' gap='l' p='l'>
      <FlairHoverCard
        content={
          <>
            <AudioTierFlairHoverCardHeader tier='bronze' />
            <FlairHoverCardBody
              icon={<IconLogoCircle size='4xl' />}
              amount='15'
              currency='$AUDIO'
            />
          </>
        }
      >
        <Flex alignItems='center' gap='s'>
          <IconTokenBronze size='m' />
          <Text>Hover me to see the Bronze Badge details</Text>
        </Flex>
      </FlairHoverCard>
    </Flex>
  )
}
