import { useCallback } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import { audioRewardsPageActions } from '@audius/common/store'
import { ScrollView, View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Flex, Text, Button, IconArrowRight } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { formatLabel } from 'app/utils/challenges'

import { AppDrawer, useDrawerState } from '../drawer/AppDrawer'
import { SummaryTable } from '../summary-table'

const { claimAllChallengeRewards, resetAndCancelClaimReward } =
  audioRewardsPageActions

const messages = {
  // Claim success toast
  claimSuccessMessage: 'Reward successfully claimed!',
  pending: (amount) => `${amount} Pending`,
  claimAudio: (amount) => `Claim ${amount} $AUDIO`,
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
  description: 'You can check and claim all your upcoming rewards here.'
}

export const ClaimAllRewardsDrawer = () => {
  const styles = useStyles()

  const dispatch = useDispatch()
  const { onClose } = useDrawerState(MODAL_NAME)
  const { claimableChallenges, cooldownChallenges, summary } =
    useChallengeCooldownSchedule({
      multiple: true
    })
  const handleClose = useCallback(() => {
    dispatch(resetAndCancelClaimReward())
    onClose()
  }, [dispatch, onClose])

  const onClaim = useCallback(() => {
    const claims = claimableChallenges.map((challenge) => ({
      challengeId: challenge.challenge_id,
      specifiers: [
        { specifier: challenge.specifier, amount: challenge.amount }
      ],
      amount: challenge.amount
    }))
    dispatch(claimAllChallengeRewards({ claims }))
  }, [dispatch, claimableChallenges])

  return (
    <AppDrawer
      modalName={MODAL_NAME}
      onClose={handleClose}
      isFullscreen
      isGestureSupported={false}
      title={config.title}
    >
      <ScrollView>
        <Flex pv='xl' ph='l' gap='xl'>
          <Text variant='body' size='m'>
            {config.description}
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
        {summary && summary?.value > 0 ? (
          <Button
            variant='primary'
            onPress={onClaim}
            iconRight={IconArrowRight}
            fullWidth
          >
            {messages.claimAudio(summary?.value)}
          </Button>
        ) : (
          <Button variant='primary' onPress={handleClose} fullWidth>
            {messages.done}
          </Button>
        )}
      </View>
    </AppDrawer>
  )
}
