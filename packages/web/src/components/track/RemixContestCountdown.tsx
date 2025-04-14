import { useRemixContest } from '@audius/common/src/api/tan-query/events/useRemixContest'
import { useRemixCountdown } from '@audius/common/src/hooks/useRemixCountdown'
import { ID } from '@audius/common/src/models/Identifiers'
import { formatDoubleDigit } from '@audius/common/src/utils/formatUtil'
import { Text, Flex, spacing, Divider } from '@audius/harmony'

import { zIndex } from 'utils/zIndex'

const messages = {
  days: 'days',
  hours: 'hours',
  minutes: 'minutes',
  seconds: 'seconds'
}

type TimeUnitProps = {
  value: number
  label: string
}

const TimeUnit = ({ value, label }: TimeUnitProps) => {
  return (
    <Flex column gap='xs' alignItems='center' justifyContent='center'>
      <Text
        variant='label'
        color='inverse'
        css={{ fontSize: 24, 'line-height': 24 }}
      >
        {formatDoubleDigit(value)}
      </Text>
      <Text variant='label' color='inverse' size='xs'>
        {label}
      </Text>
    </Flex>
  )
}

type RemixContestCountdownProps = {
  trackId: ID
}

export const RemixContestCountdown = ({
  trackId
}: RemixContestCountdownProps) => {
  const { data: remixContest } = useRemixContest(trackId)
  const timeLeft = useRemixCountdown(remixContest?.endDate)

  if (!remixContest || !timeLeft) return null

  return (
    <Flex
      gap='xl'
      pv='s'
      ph='xl'
      justifyContent='center'
      alignItems='center'
      backgroundColor='white'
      borderRadius='l'
      shadow='mid'
      css={{
        position: 'absolute',
        top: spacing.xl,
        right: spacing.unit24,
        opacity: 0.8,
        zIndex: zIndex.REMIX_CONTEST_COUNT_DOWN
      }}
    >
      <TimeUnit value={timeLeft.days} label={messages.days} />
      <Divider color='default' orientation='vertical' />
      <TimeUnit value={timeLeft.hours} label={messages.hours} />
      <Divider color='default' orientation='vertical' />
      <TimeUnit value={timeLeft.minutes} label={messages.minutes} />
      <Divider color='default' orientation='vertical' />
      <TimeUnit value={timeLeft.seconds} label={messages.seconds} />
    </Flex>
  )
}
