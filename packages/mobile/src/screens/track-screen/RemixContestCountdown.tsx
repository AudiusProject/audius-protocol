import { useRemixContest } from '@audius/common/api'
import { useFeatureFlag, useRemixCountdown } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { formatDoubleDigit } from '@audius/common/utils'

import { Text, Flex, Divider, Paper } from '@audius/harmony-native'

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
    <Flex column alignItems='center' justifyContent='center'>
      <Text variant='heading' color='inverse'>
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
  const { isEnabled: isRemixContestEnabled } = useFeatureFlag(
    FeatureFlags.REMIX_CONTEST
  )
  const { data: remixContest } = useRemixContest(trackId)
  const timeLeft = useRemixCountdown(remixContest?.endDate)

  if (!remixContest || !timeLeft || !isRemixContestEnabled) return null

  return (
    <Paper row pv='m' ph='l' borderRadius='l' backgroundColor='white'>
      {/* Note: setting opacity on Paper does not work on Android for some reason */}
      <Flex
        row
        flex={1}
        justifyContent='space-around'
        alignItems='center'
        style={{ opacity: 0.8 }}
      >
        <TimeUnit value={timeLeft.days} label={messages.days} />
        <Divider orientation='vertical' />
        <TimeUnit value={timeLeft.hours} label={messages.hours} />
        <Divider orientation='vertical' />
        <TimeUnit value={timeLeft.minutes} label={messages.minutes} />
        <Divider orientation='vertical' />
        <TimeUnit value={timeLeft.seconds} label={messages.seconds} />
      </Flex>
    </Paper>
  )
}
