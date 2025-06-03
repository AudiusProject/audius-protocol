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
  isSubdued: boolean
}

const TimeUnit = ({ value, label, isSubdued }: TimeUnitProps) => {
  return (
    <Flex column alignItems='center' justifyContent='center'>
      <Text variant='heading' color={isSubdued ? 'subdued' : 'inverse'}>
        {formatDoubleDigit(value)}
      </Text>
      <Text variant='label' color={isSubdued ? 'subdued' : 'inverse'} size='xs'>
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

  if (!remixContest || !isRemixContestEnabled) return null

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
        <TimeUnit
          value={timeLeft?.days.value ?? 0}
          label={messages.days}
          isSubdued={timeLeft?.days.isSubdued ?? true}
        />
        <Divider orientation='vertical' />
        <TimeUnit
          value={timeLeft?.hours.value ?? 0}
          label={messages.hours}
          isSubdued={timeLeft?.hours.isSubdued ?? true}
        />
        <Divider orientation='vertical' />
        <TimeUnit
          value={timeLeft?.minutes.value ?? 0}
          label={messages.minutes}
          isSubdued={timeLeft?.minutes.isSubdued ?? true}
        />
        <Divider orientation='vertical' />
        <TimeUnit
          value={timeLeft?.seconds.value ?? 0}
          label={messages.seconds}
          isSubdued={timeLeft?.seconds.isSubdued ?? true}
        />
      </Flex>
    </Paper>
  )
}
