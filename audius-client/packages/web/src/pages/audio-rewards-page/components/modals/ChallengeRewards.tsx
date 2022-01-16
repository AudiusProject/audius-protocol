import React, { useCallback, useEffect, useState, useContext } from 'react'

import { Button, ButtonType, ProgressBar, IconCheck } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconCopy } from 'assets/img/iconCopy.svg'
import { ReactComponent as IconValidationCheck } from 'assets/img/iconValidationCheck.svg'
import QRCode from 'assets/img/imageQR.png'
import { useModalState } from 'common/hooks/useModalState'
import { getAccountUser, getUserHandle } from 'common/store/account/selectors'
import {
  getChallengeRewardsModalType,
  getClaimStatus,
  getCognitoFlowStatus,
  getUserChallenges
} from 'common/store/pages/audio-rewards/selectors'
import {
  ChallengeRewardsModalType,
  setChallengeRewardsModalType,
  ClaimStatus,
  resetClaimStatus,
  resetHCaptchaStatus,
  CognitoFlowStatus,
  claimChallengeReward
} from 'common/store/pages/audio-rewards/slice'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { getHasFavoritedItem } from 'components/profile-progress/store/selectors'
import Toast from 'components/toast/Toast'
import { ToastContext } from 'components/toast/ToastContext'
import Tooltip from 'components/tooltip/Tooltip'
import { ComponentPlacement, MountPlacement } from 'components/types'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { challengeRewardsConfig } from 'pages/audio-rewards-page/config'
import { useOptimisticChallengeCompletionStepCounts } from 'pages/audio-rewards-page/hooks'
import { isMobile } from 'utils/clientUtil'
import { copyToClipboard } from 'utils/clipboardUtil'
import { CLAIM_REWARD_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import fillString from 'utils/fillString'

import PurpleBox from '../PurpleBox'

import styles from './ChallengeRewards.module.css'
import ModalDrawer from './ModalDrawer'

export const useRewardsModalType = (): [
  ChallengeRewardsModalType,
  (type: ChallengeRewardsModalType) => void
] => {
  const dispatch = useDispatch()
  const modalType = useSelector(getChallengeRewardsModalType)
  const setModalType = useCallback(
    (type: ChallengeRewardsModalType) => {
      dispatch(setChallengeRewardsModalType({ modalType: type }))
    },
    [dispatch]
  )
  return [modalType, setModalType]
}

const messages = {
  copyLabel: 'Copy to Clipboard',
  copiedLabel: 'Copied to Clipboard',
  inviteLabel: 'Copy Invite Link',
  inviteLink: 'audius.co/signup?ref=%0',
  qrText: 'Download the App',
  qrSubtext: 'Scan This QR Code with Your Phone Camera',
  rewardClaimed: 'Reward claimed successfully!',
  claimError: 'Oops, something’s gone wrong',
  claimYourReward: 'Claim Your Reward'
}

type InviteLinkProps = {
  className?: string
  handle: string
}

const InviteLink = ({ className, handle }: InviteLinkProps) => {
  const inviteLink = fillString(messages.inviteLink, handle)
  const wm = useWithMobileStyle(styles.mobile)

  const onButtonClick = useCallback(() => {
    copyToClipboard(inviteLink)
  }, [inviteLink])

  return (
    <Tooltip text={messages.copyLabel} placement={'top'} mount={'parent'}>
      <div className={cn(styles.toastContainer, { [className!]: !!className })}>
        <Toast
          text={messages.copiedLabel}
          delay={2000}
          overlayClassName={styles.toast}
          placement={ComponentPlacement.TOP}
          mount={MountPlacement.PARENT}
        >
          <PurpleBox
            label={messages.inviteLabel}
            className={wm(styles.inviteButtonContainer)}
            onClick={onButtonClick}
            text={
              <div className={styles.inviteLinkContainer}>
                <div className={styles.inviteLink}>{inviteLink}</div>
                <IconCopy className={wm(styles.inviteIcon)} />
              </div>
            }
          />
        </Toast>
      </div>
    </Tooltip>
  )
}

const ProfileChecks = () => {
  const currentUser = useSelector(getAccountUser)
  const hasFavoritedItem = useSelector(getHasFavoritedItem)
  const wm = useWithMobileStyle(styles.mobile)

  const config: Record<string, boolean> = {
    'Name & Handle': !!currentUser?.name,
    'Profile Picture': !!currentUser?.profile_picture_sizes,
    'Cover Photo': !!currentUser?.cover_photo_sizes,
    'Profile Description': !!currentUser?.bio,
    'Favorite Track/Playlist': hasFavoritedItem,
    'Repost Track/Playlist': !!currentUser && currentUser.repost_count >= 1,
    'Follow Five People': !!currentUser && currentUser.followee_count >= 5
  }

  return (
    <div className={wm(styles.profileTaskContainer)}>
      {Object.keys(config).map(key => (
        <div className={wm(styles.profileTask)} key={key}>
          {config[key] ? (
            <IconValidationCheck />
          ) : (
            <div className={styles.profileTaskCircle} />
          )}
          <p className={cn({ [styles.completeText]: config[key] })}>{key}</p>
        </div>
      ))}
    </div>
  )
}

type BodyProps = {
  dismissModal: () => void
}

const ChallengeRewardsBody = ({ dismissModal }: BodyProps) => {
  const [modalType] = useRewardsModalType()
  const userChallenges = useSelector(getUserChallenges)
  const userHandle = useSelector(getUserHandle)
  const dispatch = useDispatch()
  const wm = useWithMobileStyle(styles.mobile)
  const displayMobileContent = isMobile()

  const challenge = userChallenges[modalType]

  const {
    amount,
    fullDescription,
    progressLabel,
    stepCount,
    modalButtonInfo
  } = challengeRewardsConfig[modalType]

  const currentStepCountOverrides = useOptimisticChallengeCompletionStepCounts()
  const currentStepCountOverride = currentStepCountOverrides[modalType]
  const shouldOverrideCurrentStepCount = currentStepCountOverride !== undefined
  const currentStepCount = shouldOverrideCurrentStepCount
    ? currentStepCountOverride!
    : challenge?.current_step_count || 0

  const isIncomplete = currentStepCount === 0
  const isInProgress = currentStepCount > 0 && currentStepCount < stepCount
  const isComplete = shouldOverrideCurrentStepCount
    ? currentStepCountOverride! >= stepCount
    : !!challenge?.is_complete
  const isDisbursed = challenge?.is_disbursed ?? false
  const specifier = challenge?.specifier ?? ''

  let linkType: 'complete' | 'inProgress' | 'incomplete'
  if (isComplete) {
    linkType = 'complete'
  } else if (isInProgress) {
    linkType = 'inProgress'
  } else {
    linkType = 'incomplete'
  }
  const buttonInfo = modalButtonInfo[linkType]
  const buttonLink = buttonInfo?.link(userHandle)

  const goToRoute = useCallback(() => {
    if (!buttonLink) return
    dispatch(pushRoute(buttonLink))
    dismissModal()
  }, [buttonLink, dispatch, dismissModal])

  const progressDescription = (
    <div className={wm(styles.progressDescription)}>
      <h3>Task</h3>
      <p>{fullDescription}</p>
    </div>
  )

  const progressReward = (
    <div className={wm(styles.progressReward)}>
      <h3>Reward</h3>
      <h2>{amount}</h2>
      <h4>$AUDIO</h4>
    </div>
  )

  const progressStatusLabel = (
    <div
      className={cn(styles.progressStatus, {
        [styles.incomplete]: isIncomplete,
        [styles.inProgress]: isInProgress,
        [styles.complete]: isComplete
      })}
    >
      {isIncomplete && <h3 className={styles.incomplete}>Incomplete</h3>}
      {isComplete && <h3 className={styles.complete}>Complete</h3>}
      {isInProgress && (
        <h3 className={styles.inProgress}>
          {fillString(
            progressLabel,
            currentStepCount.toString(),
            stepCount.toString()
          )}
        </h3>
      )}
    </div>
  )

  const { toast } = useContext(ToastContext)
  const claimStatus = useSelector(getClaimStatus)
  const [displayClaimError, setDisplayClaimError] = useState(false)
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY

  const resetClaimState = useCallback(() => {
    dispatch(resetClaimStatus())
    dispatch(resetHCaptchaStatus())
  }, [dispatch])

  const onClaimRewardClicked = useCallback(() => {
    if (challenge) {
      dispatch(
        claimChallengeReward({
          claim: {
            challengeId: challenge.challenge_id,
            specifier,
            amount
          },
          retryOnFailure: true
        })
      )
    }
  }, [dispatch, challenge, specifier, amount])

  useEffect(() => {
    switch (claimStatus) {
      case ClaimStatus.ERROR:
        // attestation failed both the first claim attempt and the attempt after hCaptcha/flow verification
        resetClaimState()
        setDisplayClaimError(true)
        break
      case ClaimStatus.SUCCESS:
        // attestation succeeded and reward was disbursed
        resetClaimState()
        toast(messages.rewardClaimed, CLAIM_REWARD_TOAST_TIMEOUT_MILLIS)
        setTimeout(resetClaimState, CLAIM_REWARD_TOAST_TIMEOUT_MILLIS)
        break
      case ClaimStatus.CLAIMING:
      case ClaimStatus.NONE:
      default:
        break
    }
  }, [claimStatus, resetClaimState, setDisplayClaimError, toast])

  return (
    <div className={wm(styles.container)}>
      {displayMobileContent ? (
        <>
          {progressDescription}
          <div className={wm(styles.progressCard)}>
            <div className={wm(styles.progressInfo)}>
              {progressReward}
              <div className={wm(styles.progressBarSection)}>
                <h3>Progress</h3>
                <ProgressBar
                  className={wm(styles.progressBar)}
                  value={currentStepCount}
                  max={stepCount}
                />
              </div>
            </div>
            {progressStatusLabel}
          </div>
          {modalType === 'profile-completion' && <ProfileChecks />}
        </>
      ) : (
        <div className={styles.progressCard}>
          <div className={styles.progressInfo}>
            {progressDescription}
            {progressReward}
          </div>
          {stepCount > 1 && (
            <div className={wm(styles.progressBarSection)}>
              {modalType === 'profile-completion' && <ProfileChecks />}
              <ProgressBar
                className={wm(styles.progressBar)}
                value={currentStepCount}
                max={stepCount}
              />
            </div>
          )}
          {progressStatusLabel}
        </div>
      )}

      {userHandle && modalType === 'referrals' && (
        <InviteLink handle={userHandle} />
      )}
      {modalType === 'mobile-install' && (
        <div className={wm(styles.qrContainer)}>
          <img className={styles.qr} src={QRCode} alt='QR Code' />
          <div className={styles.qrTextContainer}>
            <h2 className={styles.qrText}>{messages.qrText}</h2>
            <h3 className={styles.qrSubtext}>{messages.qrSubtext}</h3>
          </div>
        </div>
      )}
      <div className={wm(styles.claimRewardWrapper)}>
        {buttonLink && (
          <Button
            className={wm(styles.button)}
            type={
              isComplete && !isDisbursed
                ? ButtonType.COMMON
                : ButtonType.PRIMARY_ALT
            }
            text={buttonInfo?.label}
            onClick={goToRoute}
            leftIcon={buttonInfo?.leftIcon}
            rightIcon={buttonInfo?.rightIcon}
          />
        )}
        {challenge && isComplete && !isDisbursed && (
          <Button
            text={messages.claimYourReward}
            className={wm(styles.button)}
            type={
              claimInProgress ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT
            }
            isDisabled={claimInProgress}
            rightIcon={
              claimInProgress ? (
                <LoadingSpinner className={styles.spinner} />
              ) : (
                <IconCheck />
              )
            }
            onClick={onClaimRewardClicked}
          />
        )}
      </div>
      {displayClaimError && (
        <div className={styles.claimError}>{messages.claimError}</div>
      )}
    </div>
  )
}

export const ChallengeRewardsModal = () => {
  const [modalType] = useRewardsModalType()
  const [isOpen, setOpen] = useModalState('ChallengeRewardsExplainer')
  const wm = useWithMobileStyle(styles.mobile)
  const onClose = () => setOpen(false)
  const [isHCaptchaModalOpen] = useModalState('HCaptcha')
  const cognitoFlowStatus = useSelector(getCognitoFlowStatus)

  const { icon, title } = challengeRewardsConfig[modalType]

  return (
    <ModalDrawer
      title={
        <>
          {icon}
          {title}
        </>
      }
      showTitleHeader
      isOpen={isOpen}
      onClose={onClose}
      isFullscreen={true}
      useGradientTitle={false}
      titleClassName={wm(styles.title)}
      headerContainerClassName={styles.header}
      showDismissButton={
        !isHCaptchaModalOpen && cognitoFlowStatus === CognitoFlowStatus.CLOSED
      }
      dismissOnClickOutside={
        !isHCaptchaModalOpen && cognitoFlowStatus === CognitoFlowStatus.CLOSED
      }
    >
      <ChallengeRewardsBody dismissModal={onClose} />
    </ModalDrawer>
  )
}

export default ChallengeRewardsModal
