import { ID } from '@audius/common/models'
import { formatDate } from '@audius/common/utils'
import {
  Divider,
  Flex,
  HoverCard,
  IconHeart,
  IconRepost,
  IconTrophy,
  Origin,
  Text
} from '@audius/harmony'

import UserBadges from 'components/user-badges'
import { useIsMobile } from 'hooks/useIsMobile'

import FlairIcon from './FlairIcon'
import { Size } from './types'

const anchorOrigin: Origin = {
  horizontal: 'center',
  vertical: 'top'
}

const transformOrigin: Origin = {
  horizontal: 'center',
  vertical: 'bottom'
}

const messages = { title: 'Remix Contest', submissionDue: 'Submission Due: ' }

const RemixContestFlair = ({
  endDate,
  size,
  hideToolTip
}: {
  endDate: string
  size: Size
  hideToolTip?: boolean
}) => {
  const isMobile = useIsMobile()

  if (isMobile || hideToolTip) {
    return <FlairIcon Icon={IconTrophy} size={size} />
  }

  return (
    <HoverCard
      content={
        <Flex
          column
          css={{
            minWidth: 200
          }}
        >
          <Flex ph='m' pv='s' justifyContent='center'>
            <Text size='m' textAlign='center' variant='label'>
              {messages.title}
            </Text>
          </Flex>
          <Divider orientation='horizontal' />
          <Flex ph='m' pv='s' column gap='xs'>
            <Flex row gap='s' justifyContent='center'>
              <Text strength='strong' textAlign='center'>
                {messages.submissionDue} {formatDate(endDate)}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      }
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    >
      <FlairIcon Icon={IconTrophy} size={size} />
    </HoverCard>
  )
}
export default RemixContestFlair
