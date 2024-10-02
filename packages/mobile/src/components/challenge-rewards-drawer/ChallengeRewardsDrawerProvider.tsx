import { useCallback, useEffect } from 'react'

import { ChallengeName } from '@audius/common/models'
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

import { Button } from '@audius/harmony-native'
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
  claimSuccessMessage: 'Reward successfully claimed!'
}

const MODAL_NAME = 'ChallengeRewardsExplainer'

export const ChallengeRewardsDrawerProvider = () => {
  const dispatch = useDispatch()
  const { onClose } = useDrawerState(MODAL_NAME)
  const modalType = useSelector(getChallengeRewardsModalType)
  const userChallenges = useSelector((state: CommonState) =>
    getOptimisticUserChallenges(state, true)
  )
  const undisbursedUserChallenges = useSelector(getUndisbursedUserChallenges)

  const handleClose = useCallback(() => {
    dispatch(resetAndCancelClaimReward())
    onClose()
  }, [dispatch, onClose])

  const claimStatus = useSelector(getClaimStatus)
  const aaoErrorCode = useSelector(getAAOErrorCode)

  const { toast } = useToast()

  const challenge = userChallenges ? userChallenges[modalType] : null
  const config = getChallengeConfig(modalType)
  const hasChallengeCompleted =
    challenge?.state === 'completed' || challenge?.state === 'disbursed'

  // We could just depend on undisbursedAmount here
  // But DN may have not indexed the challenge so check for client-side completion too
  // Note that we can't handle aggregate challenges optimistically
  let audioToClaim = 0
  let audioClaimedSoFar = 0
  if (challenge?.challenge_type === 'aggregate') {
    audioToClaim = challenge.claimableAmount
    audioClaimedSoFar = challenge.disbursed_amount
  } else if (challenge?.state === 'completed' && challenge?.cooldown_days) {
    audioToClaim = challenge.claimableAmount
  } else if (challenge?.state === 'completed' && !challenge?.cooldown_days) {
    audioToClaim = challenge.totalAmount
  } else if (challenge?.state === 'disbursed') {
    audioClaimedSoFar = challenge.totalAmount
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
                  ], // necessary to keep for optimistic non-cooldown challenges
            amount: challenge?.claimableAmount ?? 0
          },
          retryOnFailure: true
        })
      )
    }
  }, [dispatch, modalType, challenge, undisbursedUserChallenges])

  useEffect(() => {
    if (claimStatus === ClaimStatus.SUCCESS) {
      toast({ content: messages.claimSuccessMessage, type: 'info' })
    }
  }, [toast, claimStatus])

  // Challenge drawer contents
  let contents: Maybe<React.ReactElement>
  if (!audioToClaim) {
    switch (modalType) {
      case 'referrals':
      case 'ref-v':
      case ChallengeName.Referrals:
      case ChallengeName.ReferralsVerified:
        contents = (
          <ReferralRewardContents isVerified={!!config.isVerifiedChallenge} />
        )
        break
      case 'track-upload':
      case ChallengeName.TrackUpload:
        contents = config?.buttonInfo && (
          <Button
            iconRight={config.buttonInfo.iconRight}
            iconLeft={config.buttonInfo.iconLeft}
            variant={challenge?.state === 'disbursed' ? 'secondary' : 'primary'}
            onPress={openUploadModal}
            fullWidth
          >
            {config.completedLabel}
          </Button>
        )
        break
      case 'profile-completion':
      case ChallengeName.ProfileCompletion:
        contents = (
          <ProfileCompletionChecks
            isComplete={hasChallengeCompleted}
            onClose={handleClose}
          />
        )
        break
      default:
        contents = config?.buttonInfo ? (
          <Button
            iconRight={config.buttonInfo.iconRight}
            iconLeft={config.buttonInfo.iconLeft}
            variant={hasChallengeCompleted ? 'secondary' : 'primary'}
            onPress={handleNavigation}
            fullWidth
          >
            {challenge?.state === 'disbursed'
              ? config.completedLabel
              : config.panelButtonText}
          </Button>
        ) : undefined
    }
  }

  // Bail if not on challenges page/challenges aren't loaded
  if (!config || !challenge) {
    return null
  }

  return (
    <AppDrawer
      modalName='ChallengeRewardsExplainer'
      onClose={handleClose}
      isFullscreen
      isGestureSupported={false}
      title={config.title}
      titleImage={config.icon}
    >
      {isAudioMatchingChallenge(modalType) ? (
        <AudioMatchingChallengeDrawerContent
          aaoErrorCode={aaoErrorCode}
          challengeName={modalType}
          challenge={challenge}
          claimableAmount={audioToClaim}
          claimedAmount={audioClaimedSoFar}
          claimStatus={claimStatus}
          onNavigate={handleNavigation}
          onClaim={hasConfig ? onClaim : undefined}
        />
      ) : (
        <ChallengeRewardsDrawerContent
          description={config.description(challenge)}
          progressLabel={config.progressLabel ?? 'Completed'}
          completedLabel={config.completedLabel}
          amount={challenge.totalAmount}
          challengeId={challenge.challenge_id}
          isCooldownChallenge={challenge && challenge.cooldown_days > 0}
          challengeState={challenge.state}
          currentStep={challenge.current_step_count}
          stepCount={challenge.max_steps ?? undefined}
          claimableAmount={audioToClaim}
          claimedAmount={audioClaimedSoFar}
          claimStatus={claimStatus}
          aaoErrorCode={aaoErrorCode}
          onClaim={hasConfig ? onClaim : undefined}
          isVerifiedChallenge={!!config.isVerifiedChallenge}
          showProgressBar={
            challenge.challenge_type !== 'aggregate' &&
            challenge.max_steps !== null &&
            challenge.max_steps > 1
          }
        >
          {contents}
        </ChallengeRewardsDrawerContent>
      )}
    </AppDrawer>
  )
}
