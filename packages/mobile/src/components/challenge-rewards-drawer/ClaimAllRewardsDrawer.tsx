import { useCallback } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import type { CommonState } from '@audius/common/store'
import {
  challengesSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions
} from '@audius/common/store'
import { getClaimableChallengeSpecifiers } from '@audius/common/utils'
import { ScrollView, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, Text, Button } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import type { ChallengesParamList } from 'app/utils/challenges'

import { AppDrawer, useDrawerState } from '../drawer/AppDrawer'
import { SummaryTable } from '../summary-table'

const { getChallengeRewardsModalType, getUndisbursedUserChallenges } =
  audioRewardsPageSelectors
const { claimChallengeReward, resetAndCancelClaimReward } =
  audioRewardsPageActions
const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  // Claim success toast
  claimSuccessMessage: 'Reward successfully claimed!',
  pending: (amount) => `${amount} Pending`,
  done: 'Done'
}

const MODAL_NAME = 'ClaimAllRewards'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  button: {
    width: '100%' as const
  },
  stickyClaimRewardsContainer: {
    borderTopWidth: 1,
    borderTopColor: palette.borderDefault,
    paddingBottom: spacing(10),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(4),
    width: '100%'
  }
}))
const config = {
  id: 'rewards',
  title: 'Rewards',
  description: () => `You can check and claim all your upcoming rewards here.`,
  fullDescription: () =>
    `You can check and claim all your upcoming rewards here.`,
  progressLabel: '%0/%1 Invites Accepted',
  remainingLabel: '%0/%1 Invites Remain',
  panelButtonText: 'Invite Your Friends'
}

export const ClaimAllRewardsDrawer = () => {
  const styles = useStyles()

  const dispatch = useDispatch()
  const { onClose } = useDrawerState(MODAL_NAME)
  const modalType = useSelector(getChallengeRewardsModalType)
  const userChallenges = useSelector((state: CommonState) =>
    getOptimisticUserChallenges(state, true)
  )
  const undisbursedUserChallenges = useSelector(getUndisbursedUserChallenges)
  const { cooldownChallenges, summary } = useChallengeCooldownSchedule({
    multiple: true
  })
  const handleClose = useCallback(() => {
    dispatch(resetAndCancelClaimReward())
    onClose()
  }, [dispatch, onClose])

  const challenge = userChallenges ? userChallenges[modalType] : null
  const { navigate } = useNavigation<ChallengesParamList>()

  // Claim rewards button config
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

  const onClaim = useCallback(() => {
    if (challenge) {
      dispatch(
        claimChallengeReward({
          claim: {
            challengeId: modalType,
            specifiers:
              challenge.challenge_type === 'aggregate'
                ? getClaimableChallengeSpecifiers(
                    challenge.undisbursedSpecifiers,
                    undisbursedUserChallenges
                  )
                : [
                    { specifier: challenge.specifier, amount: challenge.amount }
                  ],
            amount: challenge?.claimableAmount ?? 0
          },
          retryOnFailure: true
        })
      )
    }
  }, [dispatch, modalType, challenge, undisbursedUserChallenges])

  return (
    <AppDrawer
      modalName='ClaimAllRewards'
      onClose={handleClose}
      isFullscreen
      isGestureSupported={false}
      title={config.title}
    >
      <ScrollView>
        <Flex pv='xl' ph='l' gap='xl'>
          <Text variant='body' size='m'>
            You can check and claim all your upcoming rewards here.
          </Text>
          <SummaryTable
            title={'Rewards'}
            secondaryTitle={'AUDIO'}
            summaryLabelColor='accent'
            summaryValueColor='default'
            items={formatCooldownChallenges(cooldownChallenges).map(
              formatLabel
            )}
            summaryItem={summary}
          />
        </Flex>
      </ScrollView>
      <View style={styles.stickyClaimRewardsContainer}>
        <Button variant='primary' onPress={onClaim} fullWidth>
          {messages.done}
        </Button>
      </View>
    </AppDrawer>
  )
}
