import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { useRemixContest } from '@audius/common/src/api/tan-query/events/useRemixContest'
import { useRemixCountdown } from '@audius/common/src/hooks/useRemixCountdown'
import { ID } from '@audius/common/src/models/Identifiers'
import { formatDoubleDigit } from '@audius/common/src/utils/formatUtil'
import { Text, Flex, spacing, Divider, Paper } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'
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
  const isMobile = useIsMobile()

  if (!remixContest || !timeLeft || !isRemixContestEnabled) return null

  return (
    <Paper
      gap='xl'
      pv='s'
      ph='xl'
      justifyContent='center'
      alignItems='center'
      borderRadius='l'
      css={
        isMobile
          ? {}
          : {
              position: 'absolute',
              top: spacing['2xl'],
              right: spacing.unit15,
              opacity: 0.8,
              zIndex: zIndex.REMIX_CONTEST_COUNT_DOWN
            }
      }
    >
      <TimeUnit value={timeLeft.days} label={messages.days} />
      <Divider color='default' orientation='vertical' />
      <TimeUnit value={timeLeft.hours} label={messages.hours} />
      <Divider color='default' orientation='vertical' />
      <TimeUnit value={timeLeft.minutes} label={messages.minutes} />
      <Divider color='default' orientation='vertical' />
      <TimeUnit value={timeLeft.seconds} label={messages.seconds} />
    </Paper>
  )
}
