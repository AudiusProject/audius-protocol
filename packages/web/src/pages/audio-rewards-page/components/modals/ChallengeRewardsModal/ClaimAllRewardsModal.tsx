import { useCallback } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import { formatNumberCommas } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconArrowRight,
  ModalContent,
  Text
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { SummaryTable } from 'components/summary-table'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import ModalDrawer from '../ModalDrawer'

import styles from './styles.module.css'

const messages = {
  upcomingRewards: 'Upcoming Rewards',
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`,
  readyToClaim: 'Ready to claim!',
  rewards: 'Rewards',
  audio: '$AUDIO',
  description: 'You can check and claim all your upcoming rewards here.',
  done: 'Done'
}

export const ClaimAllRewardsModal = () => {
  const [isOpen, setOpen] = useModalState('ClaimAllRewards')
  const [isHCaptchaModalOpen] = useModalState('HCaptcha')
  const wm = useWithMobileStyle(styles.mobile)

  const { claimableAmount, cooldownChallenges, summary } =
    useChallengeCooldownSchedule({
      multiple: true
    })
  const claimInProgress = false
  const onClaimRewardClicked = useCallback(() => {}, [])
  const formatLabel = useCallback((item: any) => {
    const { label, claimableDate, isClose } = item
    const formattedLabel = isClose ? (
      label
    ) : (
      <Text>
        {label}&nbsp;
        <Text color='subdued'>{claimableDate.format('(M/D)')}</Text>
      </Text>
    )
    return {
      ...item,
      label: formattedLabel
    }
  }, [])
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
        <Flex direction='column' gap='2xl' mt='s'>
          <Text variant='body' textAlign='left'>
            {messages.description}
          </Text>
          <SummaryTable
            title={messages.upcomingRewards}
            items={formatCooldownChallenges(cooldownChallenges).map(
              formatLabel
            )}
            summaryItem={summary}
            secondaryTitle={messages.audio}
            summaryLabelColor='accent'
            summaryValueColor='default'
          />
          {claimableAmount > 0 ? (
            <Button
              isLoading={claimInProgress}
              onClick={onClaimRewardClicked}
              iconRight={IconArrowRight}
              fullWidth
            >
              {messages.claimAudio(formatNumberCommas(claimableAmount))}
            </Button>
          ) : (
            <Button variant='primary' fullWidth>
              {messages.done}
            </Button>
          )}
        </Flex>
      </ModalContent>
    </ModalDrawer>
  )
}
