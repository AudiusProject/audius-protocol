import { useCallback, useEffect } from 'react'
import {
  Flex,
  Text,
  Button,
  IconTokenGold,
  Paper,
  spacing
} from '@audius/harmony-native'
import { SummaryTable } from '../summary-table'

import { IntKeys, StringKeys } from '@audius/common/services'
import type { CommonState } from '@audius/common/store'
import {
  challengesSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  ClaimStatus
} from '@audius/common/store'
import {
  isAudioMatchingChallenge,
  getClaimableChallengeSpecifiers
} from '@audius/common/utils'
import type { Maybe } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useToast } from 'app/hooks/useToast'
import type { ChallengesParamList } from 'app/utils/challenges'
import { getChallengeConfig } from 'app/utils/challenges'

import { AppDrawer, useDrawerState } from '../drawer/AppDrawer'

import { AudioMatchingChallengeDrawerContent } from './AudioMatchingChallengeDrawerContent'
import { ChallengeRewardsDrawerContent } from './ChallengeRewardsDrawerContent'
import { ProfileCompletionChecks } from './ProfileCompletionChecks'
import { ReferralRewardContents } from './ReferralRewardContents'
import { View } from 'react-native'
import { makeStyles } from 'app/styles'
import LinearGradient from 'react-native-linear-gradient'
import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
const {
  getChallengeRewardsModalType,
  getClaimStatus,
  getAAOErrorCode,
  getUndisbursedUserChallenges
} = audioRewardsPageSelectors
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
  }
}))

export const ClaimAllRewardsDrawer = () => {
  const styles = useStyles()

  const dispatch = useDispatch()
  const { onClose } = useDrawerState(MODAL_NAME)
  const modalType = useSelector(getChallengeRewardsModalType)
  const userChallenges = useSelector((state: CommonState) =>
    getOptimisticUserChallenges(state, true)
  )
  const undisbursedUserChallenges = useSelector(getUndisbursedUserChallenges)
  const { claimableAmount, cooldownChallenges, summary } =
    useChallengeCooldownSchedule({
      multiple: true
    })

  const handleClose = useCallback(() => {
    dispatch(resetAndCancelClaimReward())
    onClose()
  }, [dispatch, onClose])

  const { toast } = useToast()

  const challenge = userChallenges ? userChallenges[modalType] : null
  const config = {
    id: 'rewards',
    title: 'Rewards',
    description: () =>
      `You can check and claim all your upcoming rewards here.`,
    fullDescription: () =>
      `You can check and claim all your upcoming rewards here.`,
    progressLabel: '%0/%1 Invites Accepted',
    remainingLabel: '%0/%1 Invites Remain',
    panelButtonText: 'Invite Your Friends'
  }

  const { navigate } = useNavigation<ChallengesParamList>()

  const handleNavigation = useCallback(() => {
    if (config.buttonInfo?.navigation) {
      const { screen, params } = config.buttonInfo.navigation
      // @ts-expect-error not smart enough
      navigate(screen, params)
      handleClose()
    }
  }, [navigate, config, handleClose])

  const openUploadModal = useCallback(() => {
    handleClose()
    navigate('Upload')
  }, [handleClose, navigate])

  // Claim rewards button config
  const quorumSize = useRemoteVar(IntKeys.ATTESTATION_QUORUM_SIZE)
  const oracleEthAddress = useRemoteVar(StringKeys.ORACLE_ETH_ADDRESS)
  const AAOEndpoint = useRemoteVar(StringKeys.ORACLE_ENDPOINT)
  const hasConfig = (oracleEthAddress && AAOEndpoint && quorumSize > 0) || true
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
      <Flex ph='l' gap='xl'>
        <Text variant='body' size='m'>
          You can check and claim all your upcoming rewards here.
        </Text>
        <SummaryTable
          title={'Rewards'}
          secondaryTitle={'AUDIO'}
          summaryValueColor='default'
          items={formatCooldownChallenges(cooldownChallenges).map(formatLabel)}
          summaryItem={summary}
        />

        <Button variant='primary' onPress={onClaim} fullWidth>
          {messages.done}
        </Button>
      </Flex>
    </AppDrawer>
  )
}
