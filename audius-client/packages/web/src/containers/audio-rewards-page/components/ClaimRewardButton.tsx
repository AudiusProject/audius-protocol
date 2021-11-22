import React, { useCallback, useEffect } from 'react'

import { Button, ButtonType } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import {
  ChallengeRewardID,
  FailureReason,
  FlowErrorEvent,
  FlowSessionEvent,
  FlowUICloseEvent,
  FlowUIOpenEvent
} from 'common/models/AudioRewards'
import { getAccountUser, getUserHandle } from 'common/store/account/selectors'
import { getHCaptchaStatus } from 'common/store/pages/audio-rewards/selectors'
import {
  ClaimStatus,
  CognitoFlowStatus,
  HCaptchaStatus,
  setClaimStatus,
  setCognitoFlowStatus
} from 'common/store/pages/audio-rewards/slice'
import { useRemoteVar } from 'containers/remote-config/hooks'
import { useScript } from 'hooks/useScript'
import AudiusBackend from 'services/AudiusBackend'
import { IntKeys, StringKeys } from 'services/remote-config'
import { COGNITO_SCRIPT_URL } from 'utils/constants'
import { encodeHashId } from 'utils/route/hashIds'

declare global {
  interface Window {
    Flow: any
  }
}

const messages = {
  claimYourReward: 'Claim Your Reward'
}

type ClaimRewardButtonProps = {
  challengeId: ChallengeRewardID
  specifier: string
  amount: number
  isDisabled: boolean
  icon: JSX.Element
  className?: string
}

const ClaimRewardButton = ({
  challengeId,
  specifier,
  amount,
  isDisabled,
  icon,
  className
}: ClaimRewardButtonProps) => {
  const quorumSize = useRemoteVar(IntKeys.ATTESTATION_QUORUM_SIZE)
  const oracleEthAddress = useRemoteVar(StringKeys.ORACLE_ETH_ADDRESS)
  const AAOEndpoint = useRemoteVar(StringKeys.ORACLE_ENDPOINT)
  const hasConfig = oracleEthAddress && AAOEndpoint && quorumSize > 0

  const handle = useSelector(getUserHandle)
  const currentUser = useSelector(getAccountUser)
  const hCaptchaStatus = useSelector(getHCaptchaStatus)
  const dispatch = useDispatch()
  const scriptLoaded = useScript(COGNITO_SCRIPT_URL)
  const [, setHCaptchaOpen] = useModalState('HCaptcha')
  const [, setRewardModalOpen] = useModalState('ChallengeRewardsExplainer')

  const claimReward = useCallback(async () => {
    dispatch(setClaimStatus({ status: ClaimStatus.CLAIMING }))

    const currentUserId = currentUser?.user_id ?? null
    const recipientEthAddress = currentUser?.wallet ?? null
    if (!currentUserId || !recipientEthAddress) {
      throw new Error('user id or wallet not available')
    }

    const encodedUserId = encodeHashId(currentUserId)

    const response = await AudiusBackend.submitAndEvaluateAttestations({
      challengeId,
      encodedUserId,
      handle,
      recipientEthAddress,
      specifier,
      oracleEthAddress,
      amount,
      quorumSize,
      AAOEndpoint
    })

    return response
  }, [
    oracleEthAddress,
    AAOEndpoint,
    quorumSize,
    dispatch,
    currentUser,
    handle,
    challengeId,
    specifier,
    amount
  ])

  const retryClaimReward = useCallback(async () => {
    try {
      const { error } = await claimReward()
      if (error) {
        dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
      } else {
        dispatch(setClaimStatus({ status: ClaimStatus.SUCCESS }))
      }
    } catch (e) {
      console.error(`Error claiming reward after retry: ${e}`)
      dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
    }
  }, [claimReward, dispatch])

  useEffect(() => {
    switch (hCaptchaStatus) {
      case HCaptchaStatus.SUCCESS:
        console.info(
          'User submitted their hcaptcha verification, trying reward claim again...'
        )
        retryClaimReward()
        break
      case HCaptchaStatus.ERROR:
        console.error('Error claiming reward: hCaptcha verification failed')
        dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
        break
      case HCaptchaStatus.USER_CLOSED:
        console.error('Error claiming reward: user closed hCaptcha modal')
        dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
        break
      case HCaptchaStatus.NONE:
      default:
        // nothing
        break
    }
  }, [hCaptchaStatus, retryClaimReward, dispatch])

  const triggerHCaptcha = async () => {
    setRewardModalOpen(false)
    setHCaptchaOpen(true)
  }

  const triggerCognitoFlow = async () => {
    const { signature } = await AudiusBackend.getCognitoSignature()

    const flow = new window.Flow({
      publishableKey: process.env.REACT_APP_COGNITO_KEY,
      templateId: process.env.REACT_APP_COGNITO_TEMPLATE_ID,
      user: {
        customerReference: handle,
        signature
      }
    })

    flow.on('ui', (event: FlowUIOpenEvent | FlowUICloseEvent) => {
      switch (event.action) {
        case 'opened':
          dispatch(setCognitoFlowStatus({ status: CognitoFlowStatus.OPENED }))
          break
        case 'closed':
          console.error(
            'Error claiming reward: user closed the cognito flow modal'
          )
          dispatch(setCognitoFlowStatus({ status: CognitoFlowStatus.CLOSED }))
          dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
          break
        default:
          // nothing
          break
      }
    })

    flow.on('session', (event: FlowSessionEvent) => {
      switch (event.action) {
        case 'passed':
          console.info(
            'User successfully completed their flow session, trying reward claim again...'
          )
          flow.close()
          retryClaimReward()
          break
        case 'created':
          console.info('User started a new flow session')
          break
        case 'resumed':
          console.info('User resumed an existing flow session')
          break
        case 'failed':
          console.error('Error claiming reward: User failed their flow session')
          flow.close()
          dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
          break
        default:
          // nothing
          break
      }
    })

    flow.on('error', (event: FlowErrorEvent) => {
      console.error(`Error claiming reward: Flow error! ${event.message}`)
      dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
    })

    flow.open()
  }

  const handleClick = async () => {
    try {
      const { error } = await claimReward()

      if (error) {
        switch (error) {
          case FailureReason.HCAPTCHA:
            triggerHCaptcha()
            break
          case FailureReason.COGNITO_FLOW:
            triggerCognitoFlow()
            break
          case FailureReason.BLOCKED:
            throw new Error('user is blocked from claiming')
          case FailureReason.UNKNOWN_ERROR:
          default:
            throw new Error()
        }
      } else {
        dispatch(setClaimStatus({ status: ClaimStatus.SUCCESS }))
      }
    } catch (e) {
      console.log(`Error claiming reward: ${e}`)
      dispatch(setClaimStatus({ status: ClaimStatus.ERROR }))
    }
  }

  return hasConfig && handle && scriptLoaded ? (
    <Button
      className={className}
      text={messages.claimYourReward}
      onClick={handleClick}
      rightIcon={icon}
      type={ButtonType.PRIMARY_ALT}
      isDisabled={isDisabled}
    />
  ) : null
}

export default ClaimRewardButton
