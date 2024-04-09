import {
  formatAudioMatchingChallengesForCooldownSchedule,
  usePendingChallengeSchedule
} from '@audius/common/hooks'
import { challengesSelectors } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import { Button, ModalContent, Text } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { SummaryTable } from 'components/summary-table'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import ModalDrawer from '../ModalDrawer'

import styles from './styles.module.css'

const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  upcomingRewards: 'Upcoming Rewards',
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`,
  readyToClaim: 'Ready to Claim',
  rewards: 'Rewards',
  audio: '$AUDIO',
  description: 'You can check and claim all your upcoming rewards here.',
  done: 'Done'
}

export const ClaimAllRewardsModal = () => {
  const [isOpen, setOpen] = useModalState('ClaimAllRewards')
  const [isHCaptchaModalOpen] = useModalState('HCaptcha')
  const wm = useWithMobileStyle(styles.mobile)
  const userChallenges = useSelector(getOptimisticUserChallenges)

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
      title={messages.rewards}
      showTitleHeader
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      isFullscreen={true}
      useGradientTitle={false}
      titleClassName={wm(styles.title)}
      headerContainerClassName={styles.header}
      showDismissButton={!isHCaptchaModalOpen}
      dismissOnClickOutside={!isHCaptchaModalOpen}
    >
      <ModalContent>
        <div
          className={wm(cn(styles.container, styles.audioMatchingContainer))}
        >
          <Text className={wm(styles.claimAllDescription)}>
            {messages.description}
          </Text>
          <SummaryTable
            title={messages.upcomingRewards}
            items={formatAudioMatchingChallengesForCooldownSchedule(
              undisbursedChallenges
            )}
            summaryItem={{
              id: messages.readyToClaim,
              label: messages.readyToClaim,
              value: totalClaimableAmount
            }}
            secondaryTitle={messages.audio}
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
              {messages.done}
            </Button>
          )}
        </div>
      </ModalContent>
    </ModalDrawer>
  )
}
