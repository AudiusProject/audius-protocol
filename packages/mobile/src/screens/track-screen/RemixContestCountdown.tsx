import { useRemixContest } from '@audius/common/api'
import { useRemixCountdown } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { formatDoubleDigit } from '@audius/common/utils'
import { css } from '@emotion/native'

import { Text, Flex, Divider } from '@audius/harmony-native'

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
    <Flex column gap='2xs' alignItems='center' justifyContent='center'>
      <Text
        variant='label'
        color='inverse'
        style={css({ fontSize: 24, lineHeight: 24 })}
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
      row
      pv='m'
      ph='l'
      shadow='mid'
      justifyContent='space-around'
      alignItems='center'
      backgroundColor='white'
      borderRadius='l'
      style={css({
        opacity: 0.8
      })}
    >
      <TimeUnit value={timeLeft.days} label={messages.days} />
      <Divider orientation='vertical' />
      <TimeUnit value={timeLeft.hours} label={messages.hours} />
      <Divider orientation='vertical' />
      <TimeUnit value={timeLeft.minutes} label={messages.minutes} />
      <Divider orientation='vertical' />
      <TimeUnit value={timeLeft.seconds} label={messages.seconds} />
    </Flex>
  )
}
