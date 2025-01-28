import { useEffect } from 'react'

import { useFormattedProgressLabel } from '@audius/common/hooks'
import {
  ChallengeName,
  ChallengeRewardID,
  Name,
  OptimisticUserChallenge
} from '@audius/common/models'
import { AIRDROP_PAGE } from '@audius/common/src/utils/route'
import {
  ChallengeRewardsModalType,
  challengesSelectors
} from '@audius/common/store'
import { isAudioMatchingChallenge } from '@audius/common/utils'
import {
  Box,
  Flex,
  IconCheck,
  Paper,
  ProgressBar,
  Text,
  useTheme
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { useHistoryContext } from 'app/HistoryProvider'
import { make, track } from 'services/analytics'
import { doesMatchRoute } from 'utils/route'

import { StatusPill } from './StatusPill'

const { getOptimisticUserChallenges } = challengesSelectors

const PANEL_HEIGHT = 200
const PANEL_WIDTH = 336

type RewardPanelProps = {
  title: string
  description: (challenge?: OptimisticUserChallenge) => string
  progressLabel?: string
  remainingLabel?: string
  openModal: (modalType: ChallengeRewardsModalType) => void
  id: ChallengeRewardID
}

export const RewardPanel = ({
  id,
  title,
  description,
  openModal,
  progressLabel,
  remainingLabel
}: RewardPanelProps) => {
  const { color, spacing } = useTheme()
  const userChallenges = useSelector(getOptimisticUserChallenges)
  const { history } = useHistoryContext()

  const openRewardModal = () => {
    openModal(id)
    track(
      make({ eventName: Name.REWARDS_CLAIM_DETAILS_OPENED, challengeId: id })
    )
  }
  useEffect(() => {
    const match = doesMatchRoute(history.location, AIRDROP_PAGE)
    if (match) {
      openModal(ChallengeName.OneShot)
    }
  })

  const challenge = userChallenges[id]
  const hasDisbursed = challenge?.state === 'disbursed'
  const needsDisbursement = Boolean(challenge && challenge.claimableAmount > 0)
  const shouldShowProgressBar =
    challenge &&
    challenge.max_steps &&
    challenge.max_steps > 1 &&
    challenge.challenge_type !== 'aggregate' &&
    !hasDisbursed
  const shouldShowNewChallengePill =
    isAudioMatchingChallenge(id) && !needsDisbursement

  const formattedProgressLabel: string = useFormattedProgressLabel({
    challenge,
    progressLabel,
    remainingLabel
  })

  return (
    <Paper
      onClick={openRewardModal}
      ph='s'
      h={PANEL_HEIGHT}
      flex={`0 0 calc(50% - ${spacing.unit4}px)`}
      direction='column'
      m='s'
      shadow='flat'
      border='strong'
      css={{
        minWidth: PANEL_WIDTH,
        backgroundColor: hasDisbursed ? color.neutral.n25 : undefined
      }}
    >
      <Flex direction='column' h='100%'>
        <Flex justifyContent='flex-end' mt='s' w='100%'>
          <StatusPill
            shouldShowClaimPill={!!needsDisbursement}
            shouldShowNewChallengePill={shouldShowNewChallengePill}
          />
        </Flex>
        <Flex direction='column' justifyContent='center' h='100%' gap='xl'>
          <Flex
            direction='column'
            alignItems='flex-start'
            justifyContent='space-between'
            w='100%'
            gap='xl'
            pl='l'
          >
            <Box>
              <Text variant='heading' size='s'>
                {title}
              </Text>
            </Box>
            <Box css={{ textAlign: 'left' }}>
              <Text variant='body' size='m' strength='default'>
                {description(challenge)}
              </Text>
            </Box>
          </Flex>
          <Flex alignItems='center' pl='unit4' gap='s'>
            {needsDisbursement && <IconCheck size='s' color='subdued' />}
            <Box mr='l'>
              <Text variant='label' size='s' color='subdued'>
                {formattedProgressLabel}
              </Text>
            </Box>
            {shouldShowProgressBar && challenge.max_steps && (
              <Box flex='1 1 0'>
                <ProgressBar
                  value={challenge?.current_step_count ?? 0}
                  max={challenge?.max_steps}
                />
              </Box>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Paper>
  )
}
