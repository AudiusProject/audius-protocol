import React from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import {
  ChallengeName,
  type ChallengeRewardID,
  type UserChallengeState
} from '@audius/common/models'
import { ClaimStatus } from '@audius/common/store'
import { formatNumberCommas, fillString } from '@audius/common/utils'
import { ScrollView } from 'react-native-gesture-handler'

import {
  Text,
  Button,
  IconArrowRight,
  IconCheck,
  Flex
} from '@audius/harmony-native'
import { ProgressBar } from 'app/components/progress-bar'
import { formatLabel } from 'app/utils/challenges'

import { SummaryTable } from '../summary-table'

import { ChallengeDescription } from './ChallengeDescription'
import { ChallengeReward } from './ChallengeReward'
import { ClaimError } from './ClaimError'
import { useStyles } from './styles'

const messages = {
  taskVerified: 'Verified Challenge',
  progress: 'Progress',
  audio: '$AUDIO',
  incomplete: 'Incomplete',
  complete: 'Complete',
  claim: 'Claim This Reward',
  claimableLabel: '$AUDIO available to claim',
  claimableAmountLabel: (amount) => `Claim ${amount} $AUDIO`,
  claimedLabel: '$AUDIO claimed so far',
  upcomingRewards: 'Upcoming Rewards',
  readyToClaim: 'Ready to Claim',
  close: 'Close',
  claiming: 'Claiming',
  ineligible: 'Ineligible'
}

type ChallengeRewardsDrawerContentProps = {
  /** The description of the challenge */
  description: string
  /** The current progress the user has made */
  currentStep: number
  /** The number of steps the user has to complete in total */
  stepCount?: number
  /** The amount of $AUDIO that is rewarded to the user for completing the challenge */
  amount: number
  /** The label to use for the in-progress status */
  progressLabel: string
  /** The label to use for the completed status */
  completedLabel?: string
  challengeState: UserChallengeState
  /** The amount of $AUDIO available to be claimed */
  claimableAmount: number
  /** The amount of $AUDIO the user has already claimed, used in aggregate challenges */
  claimedAmount: number
  /** The status of the rewards being claimed */
  claimStatus: ClaimStatus
  /** Error code from AAO in the case of AAO rejection */
  aaoErrorCode?: number
  /** Callback that runs on the claim rewards button being clicked */
  onClaim?: () => void
  /** Whether the challenge is for verified users only */
  isVerifiedChallenge: boolean
  /** True if the challenge type is 'aggregate' */
  showProgressBar: boolean
  children?: React.ReactChild
  /** The identifier for the challenge type */
  challengeId: ChallengeRewardID
  /** True if challenge has a cooldown */
  isCooldownChallenge: boolean
  /** Callback that runs on the close button being clicked */
  onClose: () => void
}

/** Generic drawer content used for most challenges, responsible for rendering the
 * task, reward, progress, and actions.
 */
export const ChallengeRewardsDrawerContent = ({
  description,
  amount,
  currentStep,
  stepCount = 1,
  progressLabel,
  completedLabel,
  challengeId,
  isCooldownChallenge,
  challengeState,
  claimableAmount,
  claimedAmount,
  claimStatus,
  aaoErrorCode,
  onClaim,
  isVerifiedChallenge,
  showProgressBar,
  children,
  onClose
}: ChallengeRewardsDrawerContentProps) => {
  const styles = useStyles()
  const {
    cooldownChallenges,
    summary,
    isEmpty: isCooldownChallengesEmpty
  } = useChallengeCooldownSchedule({ challengeId })

  const isInProgress = challengeState === 'in_progress'
  const hasCompleted =
    challengeState === 'completed' || challengeState === 'disbursed'
  const isClaimable = claimableAmount > 0
  const statusText = isClaimable
    ? messages.readyToClaim
    : hasCompleted
      ? messages.complete
      : isInProgress
        ? fillString(
            progressLabel,
            formatNumberCommas(currentStep),
            formatNumberCommas(stepCount)
          )
        : challengeId === ChallengeName.OneShot
          ? messages.ineligible
          : messages.incomplete

  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const claimError = claimStatus === ClaimStatus.ERROR

  const renderCooldownSummaryTable = () => {
    if (isCooldownChallenge && !isCooldownChallengesEmpty) {
      return (
        <SummaryTable
          title={messages.upcomingRewards}
          items={formatCooldownChallenges(cooldownChallenges).map(formatLabel)}
          summaryItem={summary}
          secondaryTitle={messages.audio}
          summaryLabelColor='accent'
          summaryValueColor='default'
        />
      )
    }
    return null
  }

  return (
    <>
      <ScrollView style={styles.content}>
        {isVerifiedChallenge ? (
          <ChallengeDescription
            description={description}
            isCooldownChallenge={isCooldownChallenge}
          />
        ) : (
          <ChallengeDescription
            description={description}
            isCooldownChallenge={isCooldownChallenge}
          />
        )}
        <Flex alignItems='center' gap='3xl' w='100%'>
          <Flex row alignItems='center' gap='xl'>
            <ChallengeReward amount={amount} subtext={messages.audio} />
            {showProgressBar ? (
              <Flex style={styles.progressCell}>
                <Text
                  color='subdued'
                  style={[styles.subheader, styles.progressSubheader]}
                  strength='strong'
                  textTransform='uppercase'
                  variant='label'
                  size='l'
                >
                  {messages.progress}
                </Text>
                <ProgressBar progress={currentStep} max={stepCount} />
              </Flex>
            ) : null}
          </Flex>
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
              {hasCompleted ? <IconCheck size='s' color='subdued' /> : null}
              {/* Hack due to broken lineHeight for certain fonts */}
              <Flex mt='unitHalf'>
                <Text variant='label' size='l' color='subdued'>
                  {statusText}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          {children}
          <Flex w='100%'>
            {isCooldownChallenge ? renderCooldownSummaryTable() : null}
          </Flex>
        </Flex>
      </ScrollView>
      <Flex w='100%' ph='l' pv='m' gap='l'>
        {isClaimable && onClaim ? (
          <Button
            key='claimButton'
            style={styles.claimButton}
            variant={'primary'}
            isLoading={claimInProgress}
            onPress={onClaim}
            iconRight={claimInProgress ? null : IconArrowRight}
          >
            {claimInProgress
              ? messages.claiming
              : messages.claimableAmountLabel(claimableAmount)}
          </Button>
        ) : (
          <Button variant='secondary' onPress={onClose} fullWidth>
            {messages.close}
          </Button>
        )}
        {claimError ? <ClaimError aaoErrorCode={aaoErrorCode} /> : null}
      </Flex>
    </>
  )
}
