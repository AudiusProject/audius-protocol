import { useModalState } from 'common/hooks/useModalState'
import ModalDrawer from './ModalDrawer'
import { Button, IconComponent, ModalContent, Text } from '@audius/harmony'
import { SummaryTable } from 'components/summary-table'
import styles from './ChallengeRewardsModal/styles.module.css'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import {
  challengesSelectors,
  UndisbursedUserChallenge
} from '@audius/common/store'
import { useSelector } from 'react-redux'
import {
  formatAudioMatchingChallengesForCooldownSchedule,
  useAudioMatchingChallengeCooldownSchedule,
  useChallengeCooldownSchedule,
  usePendingChallengeSchedule
} from '@audius/common/hooks'
import { ChallengeRewardID } from '@audius/common/models'
import { formatNumberCommas } from '@audius/common/utils'
const { getOptimisticUserChallenges } = challengesSelectors

export const ClaimAllRewardsModal = () => {
  const [isOpen, setOpen] = useModalState('ClaimAllRewards')
  console.log('asdf opening challenge modal')
  const messages = {
    upcomingRewards: 'Upcoming Rewards',
    claimAudio: (amount: string) => `Claim ${amount} $AUDIO`
  }
  const wm = useWithMobileStyle(styles.mobile)
  const userChallenges = useSelector(getOptimisticUserChallenges)
  const claimableChallenges = Object.values(userChallenges).filter(
    (challenge) => challenge.claimableAmount > 0
  )

  const cooldownSchedules = claimableChallenges.map((challenge) =>
    useAudioMatchingChallengeCooldownSchedule(challenge.challenge_id)
  )
  const undisbursedChallenges = usePendingChallengeSchedule().cooldownChallenges
  // TODO merge conflicting dates
  const totalClaimableAmount = Object.values(userChallenges).reduce(
    (sum, challenge) => sum + challenge.claimableAmount,
    0
  )
  const claimInProgress = false
  const onClaimRewardClicked = () => {}
  return (
    <ModalDrawer
      title={'Claim All Rewards'}
      showTitleHeader
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      isFullscreen={true}
      useGradientTitle={false}
      titleClassName={wm(styles.title)}
      headerContainerClassName={styles.header}
    >
      <ModalContent>
        <Text>You can check and claim all your upcoming rewards here.</Text>
        <SummaryTable
          title={messages.upcomingRewards}
          items={formatAudioMatchingChallengesForCooldownSchedule(
            undisbursedChallenges
          )}
          summaryItem={{
            id: 'Ready to Claim',
            label: 'Ready to Claim',
            value: totalClaimableAmount
          }}
          secondaryTitle={'$AUDIO'}
          summaryLabelColor='accent'
          summaryValueColor='default'
        />
        {totalClaimableAmount > 0 ? (
          <Button
            fullWidth
            isLoading={claimInProgress}
            onClick={onClaimRewardClicked}
          >
            {messages.claimAudio(formatNumberCommas(totalClaimableAmount))}
          </Button>
        ) : (
          <Button variant='secondary' fullWidth>
            Done
          </Button>
        )}
      </ModalContent>
    </ModalDrawer>
  )
}
