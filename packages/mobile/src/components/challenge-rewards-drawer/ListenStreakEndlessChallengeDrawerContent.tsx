import type { OptimisticUserChallenge } from '@audius/common/models'
import { ChallengeName } from '@audius/common/models'
import { ClaimStatus } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import { ScrollView } from 'react-native'

import {
  Flex,
  IconArrowRight,
  Button,
  Text,
  IconHeadphones
} from '@audius/harmony-native'
import { getChallengeConfig } from 'app/utils/challenges'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { ClaimError } from './ClaimError'
import { useStyles } from './styles'

const messages = {
  rewardMapping: '$AUDIO/Day',
  totalClaimed: (amount: string) => `Total $AUDIO Claimed: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`,
  close: 'Close',
  day: (day: number) => `Day ${day} ${day > 0 ? '🔥' : ''}`
}

type ListenStreakEndlessChallengeDrawerContentProps = {
  aaoErrorCode?: number
  challenge: OptimisticUserChallenge
  claimableAmount: number
  claimedAmount: number
  claimStatus: ClaimStatus
  onClaim?: () => void
  onClose: () => void
}

/** Specialized drawer content for listen streak endless challenges, which need
 * more complicated logic and the ability to render a cooldown table.
 */
export const ListenStreakEndlessChallengeDrawerContent = ({
  aaoErrorCode,
  challenge,
  claimableAmount,
  claimedAmount,
  claimStatus,
  onClaim,
  onClose
}: ListenStreakEndlessChallengeDrawerContentProps) => {
  const styles = useStyles()
  const config = getChallengeConfig(ChallengeName.ListenStreakEndless)
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const claimError = claimStatus === ClaimStatus.ERROR

  return (
    <Flex flex={1}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <ChallengeDescription
          description={config.description(challenge)}
          isCooldownChallenge={false}
        />
        <Flex alignItems='center' gap='3xl'>
          <ChallengeReward
            amount={challenge.amount}
            subtext={messages.rewardMapping}
          />
          <Flex
            w='100%'
            ph='xl'
            border='default'
            borderRadius='s'
            backgroundColor='surface1'
          >
            <Flex
              row
              w='100%'
              alignItems='center'
              justifyContent='center'
              gap='s'
              pv='l'
            >
              <IconHeadphones size='s' color='subdued' />
              <Text
                variant='label'
                size='l'
                color='subdued'
                style={{ lineHeight: 0 }}
              >
                {messages.day(challenge.current_step_count)}
              </Text>
            </Flex>
            {claimedAmount > 0 ? (
              <Flex
                w='100%'
                row
                justifyContent='center'
                alignItems='center'
                borderTop='default'
                pv='l'
              >
                <Text
                  variant='label'
                  size='l'
                  textTransform='uppercase'
                  color='subdued'
                >
                  {messages.totalClaimed(formatNumberCommas(claimedAmount))}
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </ScrollView>
      <Flex style={styles.stickyClaimRewardsContainer}>
        {claimableAmount > 0 && onClaim ? (
          <Button
            disabled={claimInProgress}
            variant='primary'
            onPress={onClaim}
            isLoading={claimInProgress}
            iconRight={IconArrowRight}
            fullWidth
          >
            {messages.claimAudio(formatNumberCommas(claimableAmount))}
          </Button>
        ) : (
          <Button variant='secondary' onPress={onClose} fullWidth>
            {messages.close}
          </Button>
        )}
        {claimError ? <ClaimError aaoErrorCode={aaoErrorCode} /> : null}
      </Flex>
    </Flex>
  )
}
