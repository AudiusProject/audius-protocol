import React from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import type {
  ChallengeRewardID,
  UserChallengeState
} from '@audius/common/models'
import { ClaimStatus } from '@audius/common/store'
import { fillString, formatNumberCommas } from '@audius/common/utils'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import {
  Text,
  Button,
  IconArrowRight,
  IconCheck,
  IconVerified
} from '@audius/harmony-native'
import { ProgressBar } from 'app/components/progress-bar'
import { formatLabel } from 'app/utils/challenges'
import { useThemePalette } from 'app/utils/theme'

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
  upcomingRewards: 'Upcoming Rewards'
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
  children
}: ChallengeRewardsDrawerContentProps) => {
  const styles = useStyles()
  const palette = useThemePalette()
  const isInProgress = challengeState === 'in_progress'
  const isClaimable = claimableAmount > 0
  const {
    cooldownChallenges,
    summary,
    isEmpty: isCooldownChallengesEmpty
  } = useChallengeCooldownSchedule({ challengeId })

  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const claimError = claimStatus === ClaimStatus.ERROR

  const hasCompleted =
    challengeState === 'completed' || challengeState === 'disbursed'
  const statusText = hasCompleted
    ? messages.complete
    : isInProgress
      ? fillString(
          progressLabel,
          formatNumberCommas(currentStep),
          formatNumberCommas(stepCount)
        )
      : messages.incomplete

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
            task={messages.taskVerified}
            taskIcon={
              <IconVerified
                style={styles.subheaderIcon}
                fill={palette.staticPrimary}
                fillSecondary={palette.staticWhite}
              />
            }
            description={description}
          />
        ) : (
          <ChallengeDescription description={description} />
        )}
        <View style={styles.statusGrid}>
          <View style={styles.statusGridColumns}>
            <ChallengeReward amount={amount} subtext={messages.audio} />
            {showProgressBar ? (
              <View style={styles.progressCell}>
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
              </View>
            ) : null}
          </View>
          <View
            style={[
              styles.statusCell,
              hasCompleted ? styles.statusCellComplete : null
            ]}
          >
            <Text
              style={[styles.subheader]}
              strength='strong'
              textTransform='uppercase'
              variant='label'
              color={
                hasCompleted
                  ? 'staticWhite'
                  : isInProgress
                    ? 'accent'
                    : 'default'
              }
            >
              {statusText}
            </Text>
          </View>
        </View>
        <View style={styles.claimRewardsContainer}>
          {isClaimable && onClaim ? (
            isCooldownChallenge ? (
              renderCooldownSummaryTable()
            ) : (
              <>
                <Button
                  style={styles.claimButton}
                  variant={claimInProgress ? 'secondary' : 'primary'}
                  isLoading={claimInProgress}
                  onPress={onClaim}
                  iconLeft={IconCheck}
                >
                  {messages.claim}
                </Button>
              </>
            )
          ) : null}
          {claimError ? <ClaimError aaoErrorCode={aaoErrorCode} /> : null}
        </View>
        {children}
      </ScrollView>
      {isClaimable && onClaim && isCooldownChallenge ? (
        <View style={styles.stickyClaimRewardsContainer}>
          <Button
            key='claimButton'
            style={styles.claimButton}
            variant={claimInProgress ? 'secondary' : 'primary'}
            isLoading={claimInProgress}
            onPress={onClaim}
            iconRight={IconArrowRight}
          >
            {messages.claimableAmountLabel(claimableAmount)}
          </Button>
        </View>
      ) : null}
    </>
  )
}
