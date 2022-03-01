import { useCallback, useContext, useEffect } from 'react'

import {
  IntKeys,
  StringKeys
} from 'audius-client/src/common/services/remote-config'
import { getOptimisticUserChallenges } from 'audius-client/src/common/store/challenges/selectors/optimistic-challenges'
import {
  getChallengeRewardsModalType,
  getClaimStatus
} from 'audius-client/src/common/store/pages/audio-rewards/selectors'
import {
  ChallengeRewardsModalType,
  claimChallengeReward,
  ClaimStatus,
  resetAndCancelClaimReward
} from 'audius-client/src/common/store/pages/audio-rewards/slice'
import {
  getModalVisibility,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import { Maybe } from 'audius-client/src/common/utils/typeUtils'
import {
  ACCOUNT_VERIFICATION_SETTINGS_PAGE,
  AUDIO_PAGE,
  TRENDING_PAGE,
  UPLOAD_PAGE
} from 'audius-client/src/utils/route'
import { ImageSourcePropType } from 'react-native'

import Headphone from 'app/assets/images/emojis/headphone.png'
import IncomingEnvelope from 'app/assets/images/emojis/incoming-envelope.png'
import LoveLetter from 'app/assets/images/emojis/love-letter.png'
import MobilePhoneWithArrow from 'app/assets/images/emojis/mobile-phone-with-arrow.png'
import MultipleMusicalNotes from 'app/assets/images/emojis/multiple-musical-notes.png'
import WhiteHeavyCheckMark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconArrow from 'app/assets/images/iconArrow.svg'
import IconCheck from 'app/assets/images/iconCheck.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import Button, { ButtonType } from '../button'
import { ToastContext } from '../toast/ToastContext'

import { ChallengeRewardsDrawer } from './ChallengeRewardsDrawer'
import { ProfileCompletionChecks } from './ProfileCompletionChecks'
import { ReferralRewardContents } from './ReferralRewardContents'

const messages = {
  // Connect Verified
  connectVerifiedTitle: 'Link Verified Accounts',
  connectVerifiedDescription:
    'Get verified on Audius by linking your verified Twitter or Instagram account!',
  connectVerifiedButton: 'Verify Your Account',

  // Listen Streak
  listenStreakTitle: 'Listening Streak: 7 Days',
  listenStreakDescription:
    'Sign in and listen to at least one track every day for 7 days',
  listenStreakProgressLabel: 'Days',
  listenStreakButton: 'Trending Tracks',

  // Mobile Install
  mobileInstallTitle: 'Get the Audius Mobile App',
  mobileInstallDescription:
    'Install the Audius app for iPhone and Android and Sign in to your account!',

  // Profile Completion
  profileCompletionTitle: 'Complete Your Profile',
  profileCompletionDescription:
    'Fill out the missing details on your Audius profile and start interacting with tracks and artists!',
  profileCompletionProgressLabel: 'Complete',

  // Referrals
  referreralsTitle: 'Invite your Friends',
  referralsDescription:
    'Invite your Friends! You’ll earn 1 $AUDIO for each friend who joins with your link (and they’ll get an $AUDIO too)',
  referralsProgressLabel: 'Invites Accepted',

  // Verified Referrals
  referreralsVerifiedTitle: 'Invite your Fans',
  referralsVerifiedDescription:
    'Invite your fans! You’ll earn 1 $AUDIO for each friend who joins with your link (and they’ll get an $AUDIO too)',
  referralsVerifiedProgressLabel: 'Invites Accepted',

  // Referred
  referredTitle: 'You Accepted An Invite',
  referredDescription: 'You earned $AUDIO for being invited',

  // Track Upload
  trackUploadTitle: 'Upload 3 Tracks',
  trackUploadDescription: 'Upload 3 tracks to your profile',
  trackUploadProgressLabel: 'Uploaded',
  trackUploadButton: 'Upload Tracks',

  // Claim success toast
  claimSuccessMessage: 'Reward successfully claimed!'
}

const MODAL_NAME = 'ChallengeRewardsExplainer'
type ChallengeConfig = {
  icon: ImageSourcePropType
  title: string
  description: string
  progressLabel?: string
  isVerifiedChallenge?: boolean
  buttonInfo?: {
    link: string
    label: string
    renderIcon: (color: string) => React.ReactElement
    iconPosition: 'left' | 'right'
  }
}
const challengesConfig: Record<ChallengeRewardsModalType, ChallengeConfig> = {
  'connect-verified': {
    icon: WhiteHeavyCheckMark,
    title: messages.connectVerifiedTitle,
    description: messages.connectVerifiedDescription,
    buttonInfo: {
      label: messages.connectVerifiedButton,
      link: ACCOUNT_VERIFICATION_SETTINGS_PAGE,
      renderIcon: color => <IconCheck fill={color} />,
      iconPosition: 'right'
    }
  },
  'listen-streak': {
    icon: Headphone,
    title: messages.listenStreakTitle,
    description: messages.listenStreakDescription,
    progressLabel: messages.listenStreakProgressLabel,
    buttonInfo: {
      label: messages.listenStreakButton,
      link: TRENDING_PAGE,
      renderIcon: color => <IconArrow fill={color} />,
      iconPosition: 'right'
    }
  },
  'mobile-install': {
    icon: MobilePhoneWithArrow,
    title: messages.mobileInstallTitle,
    description: messages.mobileInstallDescription
  },
  'profile-completion': {
    icon: WhiteHeavyCheckMark,
    title: messages.profileCompletionTitle,
    description: messages.profileCompletionDescription,
    progressLabel: messages.profileCompletionProgressLabel
  },
  referrals: {
    icon: IncomingEnvelope,
    title: messages.referreralsTitle,
    description: messages.referralsDescription,
    progressLabel: messages.referralsProgressLabel
  },
  'ref-v': {
    icon: IncomingEnvelope,
    title: messages.referreralsVerifiedTitle,
    description: messages.referralsVerifiedDescription,
    progressLabel: messages.referralsVerifiedProgressLabel,
    isVerifiedChallenge: true
  },
  referred: {
    icon: LoveLetter,
    title: messages.referredTitle,
    description: messages.referredDescription,
    progressLabel: ''
  },
  'track-upload': {
    icon: MultipleMusicalNotes,
    title: messages.trackUploadTitle,
    description: messages.trackUploadDescription,
    progressLabel: messages.trackUploadProgressLabel,
    buttonInfo: {
      label: messages.trackUploadButton,
      link: UPLOAD_PAGE,
      renderIcon: color => <IconUpload fill={color} />,
      iconPosition: 'right'
    }
  }
}
const styles = {
  button: {
    width: '100%'
  }
}

const renderUploadIcon = color => <IconUpload fill={color} />

export const ChallengeRewardsDrawerProvider = () => {
  const dispatchWeb = useDispatchWeb()
  const pushRouteWeb = usePushRouteWeb()
  const isVisible = useSelectorWeb(state =>
    getModalVisibility(state, MODAL_NAME)
  )
  const modalType = useSelectorWeb(getChallengeRewardsModalType)
  const userChallenges = useSelectorWeb(getOptimisticUserChallenges)
  const onClose = useCallback(() => {
    dispatchWeb(resetAndCancelClaimReward())
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: false }))
  }, [dispatchWeb])
  const claimStatus = useSelectorWeb(getClaimStatus)

  const { toast } = useContext(ToastContext)

  const challenge = userChallenges ? userChallenges[modalType] : null
  const config = challengesConfig[modalType]
  const hasChallengeCompleted =
    challenge?.state === 'completed' || challenge?.state === 'disbursed'

  // We could just depend on undisbursedAmount here
  // But DN may have not indexed the challenge so check for client-side completion too
  // Note that we can't handle aggregate challenges optimistically
  let audioToClaim = 0
  let audioClaimedSoFar = 0
  if (challenge?.challenge_type === 'aggregate') {
    audioToClaim = challenge.claimableAmount
    audioClaimedSoFar =
      challenge.amount * challenge.current_step_count - audioToClaim
  } else if (challenge?.state === 'completed') {
    audioToClaim = challenge.totalAmount
    audioClaimedSoFar = 0
  } else if (challenge?.state === 'disbursed') {
    audioToClaim = 0
    audioClaimedSoFar = challenge.totalAmount
  }

  const goToRoute = useCallback(() => {
    if (!config.buttonInfo?.link) {
      return
    }
    pushRouteWeb(config.buttonInfo.link, AUDIO_PAGE, false)
    onClose()
  }, [pushRouteWeb, onClose, config])

  const openUploadModal = useCallback(() => {
    onClose()
    dispatchWeb(setVisibility({ modal: 'MobileUpload', visible: true }))
  }, [dispatchWeb, onClose])

  // Claim rewards button config
  const quorumSize = useRemoteVar(IntKeys.ATTESTATION_QUORUM_SIZE)
  const oracleEthAddress = useRemoteVar(StringKeys.ORACLE_ETH_ADDRESS)
  const AAOEndpoint = useRemoteVar(StringKeys.ORACLE_ENDPOINT)
  const hasConfig = (oracleEthAddress && AAOEndpoint && quorumSize > 0) || true
  const onClaim = useCallback(() => {
    dispatchWeb(
      claimChallengeReward({
        claim: {
          challengeId: modalType,
          specifiers: [challenge?.specifier ?? ''],
          amount: challenge?.amount ?? 0
        },
        retryOnFailure: true
      })
    )
  }, [dispatchWeb, modalType, challenge])

  useEffect(() => {
    if (claimStatus === ClaimStatus.SUCCESS) {
      toast({ content: messages.claimSuccessMessage, type: 'info' })
    }
  }, [toast, claimStatus])

  // Challenge drawer contents
  let contents: Maybe<React.ReactElement>
  switch (modalType) {
    case 'referrals':
    case 'ref-v':
      contents = (
        <ReferralRewardContents isVerified={!!config.isVerifiedChallenge} />
      )
      break
    case 'track-upload':
      contents = (
        <Button
          containerStyle={styles.button}
          title={messages.trackUploadButton}
          renderIcon={renderUploadIcon}
          iconPosition='right'
          type={
            challenge?.state === 'completed' || challenge?.state === 'disbursed'
              ? ButtonType.COMMON
              : ButtonType.PRIMARY
          }
          onPress={openUploadModal}
        />
      )
      break
    case 'profile-completion':
      contents = (
        <ProfileCompletionChecks
          isComplete={hasChallengeCompleted}
          onClose={onClose}
        />
      )
      break
    default:
      contents = config?.buttonInfo && (
        <Button
          containerStyle={styles.button}
          title={config.buttonInfo.label}
          renderIcon={config.buttonInfo.renderIcon}
          iconPosition={config.buttonInfo.iconPosition}
          type={hasChallengeCompleted ? ButtonType.COMMON : ButtonType.PRIMARY}
          onPress={goToRoute}
        />
      )
  }

  // Bail if not on challenges page/challenges aren't loaded
  if (!config || !challenge) {
    return null
  }

  return (
    <ChallengeRewardsDrawer
      isOpen={isVisible}
      onClose={onClose}
      title={config.title}
      titleIcon={config.icon}
      description={config.description}
      progressLabel={config.progressLabel ?? 'Completed'}
      amount={challenge.totalAmount}
      challengeState={challenge.state}
      currentStep={challenge.current_step_count}
      stepCount={challenge.max_steps}
      claimableAmount={audioToClaim}
      claimedAmount={audioClaimedSoFar}
      claimStatus={claimStatus}
      onClaim={hasConfig ? onClaim : undefined}
      isVerifiedChallenge={!!config.isVerifiedChallenge}
      showProgressBar={
        challenge.challenge_type !== 'aggregate' && challenge.max_steps > 1
      }
    >
      {contents}
    </ChallengeRewardsDrawer>
  )
}
