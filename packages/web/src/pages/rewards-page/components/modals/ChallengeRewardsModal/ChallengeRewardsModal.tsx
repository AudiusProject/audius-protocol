import { useCallback, useEffect, useContext, useMemo } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import { ChallengeName } from '@audius/common/models'
import {
  accountSelectors,
  challengesSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  ClaimStatus,
  musicConfettiActions,
  ChallengeRewardsModalType
} from '@audius/common/store'
import {
  fillString,
  formatNumberCommas,
  getAAOErrorEmojis,
  challengeRewardsConfig,
  isAudioMatchingChallenge,
  getClaimableChallengeSpecifiers
} from '@audius/common/utils'
import {
  ModalContent,
  IconCopy,
  IconValidationCheck,
  IconCheck,
  IconVerified,
  IconTwitter as IconTwitterBird,
  SocialButton,
  Button,
  Text,
  ProgressBar,
  Flex,
  Paper
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import QRCode from 'assets/img/imageQR.png'
import { useModalState } from 'common/hooks/useModalState'
import { SummaryTable } from 'components/summary-table'
import Toast from 'components/toast/Toast'
import { ToastContext } from 'components/toast/ToastContext'
import Tooltip from 'components/tooltip/Tooltip'
import { ComponentPlacement, MountPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { getChallengeConfig } from 'pages/audio-rewards-page/config'
import { copyToClipboard, getCopyableLink } from 'utils/clipboardUtil'
import { CLAIM_REWARD_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { push as pushRoute } from 'utils/navigation'
import { openTwitterLink } from 'utils/tweet'

import ModalDrawer from '../ModalDrawer'

import { AudioMatchingRewardsModalContent } from './AudioMatchingRewardsModalContent'
import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'
import styles from './styles.module.css'

const { show: showConfetti } = musicConfettiActions
const {
  getAAOErrorCode,
  getChallengeRewardsModalType,
  getClaimStatus,
  getUndisbursedUserChallenges
} = audioRewardsPageSelectors
const {
  setChallengeRewardsModalType,
  resetAndCancelClaimReward,
  claimChallengeReward
} = audioRewardsPageActions
const { getOptimisticUserChallenges, getCompletionStages } = challengesSelectors
const getUserHandle = accountSelectors.getUserHandle

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
const inviteLink = getCopyableLink('/signup?rf=%0')

const messages = {
  audio: '$AUDIO',
  everyDollarSpent: ' Every Dollar Spent',
  copyLabel: 'Copy to Clipboard',
  copiedLabel: 'Copied to Clipboard',
  inviteLabel: 'Copy Invite to Clipboard',
  inviteLink,
  qrText: 'Download the App',
  qrSubtext: 'Scan This QR Code with Your Phone Camera',
  rewardClaimed: 'Reward claimed successfully!',
  rewardAlreadyClaimed: 'Reward already claimed!',
  claimError:
    'Something has gone wrong, not all your rewards were claimed. Please try again or contact support@audius.co.',
  claimErrorAAO:
    'Your account is unable to claim rewards at this time. Please try again later or contact support@audius.co. ',
  claimableAmountLabel: (amount: number) => `Claim $${amount} AUDIO`,
  twitterShare: (
    modalType:
      | 'referrals'
      | 'ref-v'
      | ChallengeName.Referrals
      | ChallengeName.ReferralsVerified
  ) =>
    `Share Invite With Your ${
      modalType === 'referrals' || modalType === ChallengeName.Referrals
        ? 'Friends'
        : 'Fans'
    }`,
  twitterCopy: `Come support me on @audius! Use my link and we both earn $AUDIO when you sign up.\n\n #Audius #AudioRewards\n\n`,
  twitterReferralLabel: 'Share referral link on Twitter',
  verifiedChallenge: 'VERIFIED CHALLENGE',
  claimAmountLabel: '$AUDIO available to claim',
  claimedSoFar: '$AUDIO claimed so far',
  upcomingRewards: 'Upcoming Rewards',
  cooldownDescription:
    'Note: There is a 7 day waiting period from completion until you can claim your reward.',

  // Profile checks
  profileCheckNameAndHandle: 'Name & Handle',
  profileCheckProfilePicture: 'Profile Picture',
  profileCheckCoverPhoto: 'Cover Photo',
  profileCheckProfileDescription: 'Profile Description',
  profileCheckFavorite: 'Favorite Track/Playlist',
  profileCheckRepost: 'Repost Track/Playlist',
  profileCheckFollow: 'Follow Five People',
  progress: 'Progress',
  taskDetails: 'Task Details',
  complete: 'Complete',
  incomplete: 'Incomplete'
}

type InviteLinkProps = {
  className?: string
  inviteLink: string
}

export const InviteLink = ({ className, inviteLink }: InviteLinkProps) => {
  const wm = useWithMobileStyle(styles.mobile)

  const onButtonClick = useCallback(() => {
    copyToClipboard(inviteLink)
  }, [inviteLink])

  return (
    <Tooltip text={messages.copyLabel} placement={'top'} mount={'parent'}>
      <div className={wm(styles.toastContainer, { [className!]: !!className })}>
        <Toast
          text={messages.copiedLabel}
          delay={2000}
          placement={ComponentPlacement.TOP}
          mount={MountPlacement.PARENT}
        >
          <div className={wm(styles.inviteButtonContainer)}>
            <Button
              variant='primary'
              iconRight={IconCopy}
              onClick={onButtonClick}
              fullWidth
            >
              {messages.inviteLabel}
            </Button>
          </div>
        </Toast>
      </div>
    </Tooltip>
  )
}

type TwitterShareButtonProps = {
  modalType:
    | 'referrals'
    | 'ref-v'
    | ChallengeName.Referrals
    | ChallengeName.ReferralsVerified
  inviteLink: string
}

const TwitterShareButton = ({
  modalType,
  inviteLink
}: TwitterShareButtonProps) => {
  const isMobile = useIsMobile()

  return (
    <SocialButton
      socialType='twitter'
      iconLeft={IconTwitterBird}
      onClick={() => openTwitterLink(inviteLink, messages.twitterCopy)}
      aria-label={messages.twitterReferralLabel}
      fullWidth={isMobile}
    >
      {messages.twitterShare(modalType)}
    </SocialButton>
  )
}

const ProfileChecks = () => {
  const completionStages = useSelector(getCompletionStages)
  const wm = useWithMobileStyle(styles.mobile)
  const isMobile = useIsMobile()

  const config: Record<string, boolean> = {
    [messages.profileCheckNameAndHandle]: completionStages.hasNameAndHandle,
    [messages.profileCheckProfilePicture]: completionStages.hasProfilePicture,
    [messages.profileCheckCoverPhoto]: completionStages.hasCoverPhoto,
    [messages.profileCheckProfileDescription]:
      completionStages.hasProfileDescription,
    [messages.profileCheckFavorite]: completionStages.hasFavoritedItem,
    [messages.profileCheckRepost]: !!completionStages.hasReposted,
    [messages.profileCheckFollow]: completionStages.hasFollowedAccounts
  }

  return (
    <Flex
      column
      gap='m'
      wrap='wrap'
      ph={isMobile ? undefined : 'xl'}
      pv={isMobile ? undefined : 'm'}
      justifyContent='center'
      css={{
        maxHeight: 150
      }}
    >
      {Object.keys(config).map((key) => (
        <div className={wm(styles.profileTask)} key={key}>
          {config[key] ? (
            <IconValidationCheck />
          ) : (
            <div className={styles.profileTaskCircle} />
          )}
          <p className={cn({ [styles.completeText]: config[key] })}>{key}</p>
        </div>
      ))}
    </Flex>
  )
}

const getErrorMessage = (aaoErrorCode?: number) => {
  if (aaoErrorCode !== undefined) {
    return (
      <>
        {messages.claimErrorAAO}
        {getAAOErrorEmojis(aaoErrorCode)}
      </>
    )
  }
  return <>{messages.claimError}</>
}

type BodyProps = {
  dismissModal: () => void
}

const ChallengeRewardsBody = ({ dismissModal }: BodyProps) => {
  const { toast } = useContext(ToastContext)
  const claimStatus = useSelector(getClaimStatus)
  const aaoErrorCode = useSelector(getAAOErrorCode)
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY
  const undisbursedUserChallenges = useSelector(getUndisbursedUserChallenges)
  const [modalType] = useRewardsModalType()
  const userHandle = useSelector(getUserHandle)
  const dispatch = useDispatch()
  const wm = useWithMobileStyle(styles.mobile)
  const isMobile = useIsMobile()
  const userChallenges = useSelector(getOptimisticUserChallenges)
  const challenge = userChallenges[modalType]
  const isCooldownChallenge = challenge && challenge.cooldown_days > 0
  const currentStepCount = challenge?.current_step_count || 0
  const {
    fullDescription,
    progressLabel,
    completedLabel,
    isVerifiedChallenge
  } = challengeRewardsConfig[modalType]
  const { modalButtonInfo } = getChallengeConfig(modalType)
  const {
    cooldownChallenges,
    summary,
    isEmpty: isCooldownChallengesEmpty
  } = useChallengeCooldownSchedule({ challengeId: challenge?.challenge_id })

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

  let linkType: 'complete' | 'inProgress' | 'incomplete'
  if (challenge?.state === 'completed') {
    linkType = 'complete'
  } else if (challenge?.state === 'in_progress') {
    linkType = 'inProgress'
  } else {
    linkType = 'incomplete'
  }
  const buttonInfo = modalButtonInfo?.[linkType] ?? null
  const buttonLink = buttonInfo?.link(userHandle)

  const showProgressBar =
    challenge &&
    challenge.max_steps &&
    challenge.max_steps > 1 &&
    challenge.challenge_type !== 'aggregate'

  const progressDescriptionLabel = isVerifiedChallenge ? (
    <div className={styles.verifiedChallenge}>
      <IconVerified />
      {messages.verifiedChallenge}
    </div>
  ) : (
    <Text variant='label' size='l' strength='strong'>
      {messages.taskDetails}
    </Text>
  )
  const progressDescription = (
    <Flex column gap='m'>
      <Text variant='body'>{fullDescription?.(challenge)}</Text>
      {isCooldownChallenge ? (
        <Text variant='body' color='subdued'>
          {messages.cooldownDescription}
        </Text>
      ) : null}
    </Flex>
  )

  const renderProgressStatusLabel = () => (
    <Flex alignItems='center'>
      {challenge?.state === 'incomplete' ? (
        <Text variant='label' size='l' strength='strong' color='subdued'>
          {messages.incomplete}
        </Text>
      ) : null}
      {challenge?.state === 'completed' || challenge?.state === 'disbursed' ? (
        <Flex gap='s' justifyContent='center' alignItems='center'>
          <IconCheck width={16} height={16} color='subdued' />
          <Text variant='label' size='l' strength='strong' color='subdued'>
            {messages.complete}
          </Text>
        </Flex>
      ) : null}
      {challenge?.state === 'in_progress' && progressLabel ? (
        <Text
          variant='label'
          size='l'
          strength='strong'
          color='subdued'
          ellipses
        >
          {fillString(
            progressLabel,
            formatNumberCommas(currentStepCount.toString()),
            formatNumberCommas(challenge?.max_steps?.toString() ?? '')
          )}
        </Text>
      ) : null}
    </Flex>
  )

  const inviteLink = useMemo(
    () => (userHandle ? fillString(messages.inviteLink, userHandle) : ''),
    [userHandle]
  )

  const errorContent =
    claimStatus === ClaimStatus.ERROR ? (
      <div className={styles.claimError}>{getErrorMessage(aaoErrorCode)}</div>
    ) : null

  useEffect(() => {
    if (claimStatus === ClaimStatus.SUCCESS) {
      toast(messages.rewardClaimed, CLAIM_REWARD_TOAST_TIMEOUT_MILLIS)
      dispatch(showConfetti())
    }
    if (claimStatus === ClaimStatus.ALREADY_CLAIMED) {
      toast(messages.rewardAlreadyClaimed, CLAIM_REWARD_TOAST_TIMEOUT_MILLIS)
    }
  }, [claimStatus, toast, dispatch])

  const onClaimRewardClicked = useCallback(() => {
    if (challenge) {
      dispatch(
        claimChallengeReward({
          claim: {
            challengeId: challenge.challenge_id,
            specifiers:
              challenge.challenge_type === 'aggregate'
                ? getClaimableChallengeSpecifiers(
                    challenge.undisbursedSpecifiers,
                    undisbursedUserChallenges
                  )
                : [
                    { specifier: challenge.specifier, amount: challenge.amount }
                  ], // necessary to keep for optimistic non-cooldown challenges
            amount: challenge.claimableAmount
          },
          retryOnFailure: true
        })
      )
    }
  }, [challenge, dispatch, undisbursedUserChallenges])

  const goToRoute = useCallback(() => {
    if (!buttonLink) return
    dispatch(pushRoute(buttonLink))
    dismissModal()
  }, [buttonLink, dispatch, dismissModal])

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

  const renderCooldownSummaryTable = () => {
    if (isCooldownChallenge && !isCooldownChallengesEmpty) {
      return (
        <SummaryTable
          title={messages.upcomingRewards}
          items={formatCooldownChallenges(cooldownChallenges).map(formatLabel)}
          summaryItem={summary}
          secondaryTitle={messages.audio}
          summaryLabelColor='accent'
          summaryValueColor='default'
        />
      )
    }
    return null
  }

  const renderProgressBar = () => {
    if (showProgressBar && challenge.max_steps) {
      return isMobile ? (
        <Flex
          column
          gap='s'
          ph='l'
          pv='xl'
          borderLeft='strong'
          css={{
            flex: '1 1 0%'
          }}
        >
          <Text variant='label' size='l' strength='strong' color='subdued'>
            {messages.progress}
          </Text>
          <ProgressBar
            className={wm(styles.progressBar)}
            value={currentStepCount}
            max={challenge?.max_steps}
          />
        </Flex>
      ) : (
        <ProgressBar
          className={wm(styles.progressBar)}
          value={currentStepCount}
          max={challenge?.max_steps}
        />
      )
    }
    return null
  }

  const renderReferralContent = () => {
    if (
      userHandle &&
      (modalType === 'referrals' ||
        modalType === 'ref-v' ||
        modalType === ChallengeName.Referrals ||
        modalType === ChallengeName.ReferralsVerified)
    ) {
      return (
        <div className={wm(styles.buttonContainer)}>
          <TwitterShareButton modalType={modalType} inviteLink={inviteLink} />
          <div className={styles.buttonSpacer} />
          <InviteLink inviteLink={inviteLink} />
        </div>
      )
    }
    return null
  }

  const renderMobileInstallContent = () => {
    if (modalType === 'mobile-install' || modalType === 'm') {
      return (
        <div className={wm(styles.qrContainer)}>
          <img className={styles.qr} src={QRCode} alt='QR Code' />
          <div className={styles.qrTextContainer}>
            <h2 className={styles.qrText}>{messages.qrText}</h2>
            <h3 className={styles.qrSubtext}>{messages.qrSubtext}</h3>
          </div>
        </div>
      )
    }
    return null
  }

  const renderClaimButton = () => {
    if (audioToClaim > 0) {
      return (
        <Button
          variant='primary'
          isLoading={claimInProgress}
          iconRight={IconCheck}
          onClick={onClaimRewardClicked}
          fullWidth
        >
          {messages.claimableAmountLabel(audioToClaim)}
        </Button>
      )
    }
    return null
  }

  const renderClaimedSoFarContent = () => {
    if (audioClaimedSoFar > 0 && challenge?.state !== 'disbursed') {
      return (
        <div className={styles.claimRewardClaimedAmountLabel}>
          {`${formatNumberCommas(audioClaimedSoFar)} ${messages.claimedSoFar}`}
        </div>
      )
    }
    return null
  }

  if (isAudioMatchingChallenge(modalType)) {
    return (
      <AudioMatchingRewardsModalContent
        errorContent={errorContent}
        onNavigateAway={dismissModal}
        onClaimRewardClicked={onClaimRewardClicked}
        claimInProgress={claimInProgress}
        challenge={challenge}
        challengeName={modalType}
      />
    )
  } else {
    return (
      <Flex column alignItems='center' gap='2xl'>
        {isMobile ? (
          <>
            <ProgressDescription
              label={progressDescriptionLabel}
              description={progressDescription}
            />
            <Paper
              column
              shadow='flat'
              border='strong'
              borderRadius='m'
              w='100%'
              backgroundColor='surface1'
            >
              <Flex justifyContent='center' borderBottom='strong'>
                <ProgressReward
                  amount={formatNumberCommas(challenge?.totalAmount ?? '')}
                  subtext={messages.audio}
                />
                {renderProgressBar()}
              </Flex>
              <Flex justifyContent='center' ph='xl' pv='l'>
                {renderProgressStatusLabel()}
              </Flex>
            </Paper>
            {modalType === 'profile-completion' ||
            modalType === ChallengeName.ProfileCompletion ? (
              <ProfileChecks />
            ) : null}
            {renderCooldownSummaryTable()}
          </>
        ) : (
          <>
            <Paper
              column
              shadow='flat'
              border='strong'
              borderRadius='m'
              w='100%'
              backgroundColor='surface1'
            >
              <Flex justifyContent='space-between'>
                <ProgressDescription
                  label={progressDescriptionLabel}
                  description={progressDescription}
                />
                <ProgressReward
                  amount={formatNumberCommas(challenge?.totalAmount ?? '')}
                  subtext={messages.audio}
                />
              </Flex>
              <Flex
                pv='l'
                ph='xl'
                borderTop='strong'
                gap='l'
                borderBottomLeftRadius='m'
                borderBottomRightRadius='m'
                justifyContent='center'
              >
                {renderProgressStatusLabel()}
                {renderProgressBar()}
              </Flex>
              {modalType === 'profile-completion' ||
              modalType === ChallengeName.ProfileCompletion ? (
                <ProfileChecks />
              ) : null}
            </Paper>
            {renderCooldownSummaryTable()}
          </>
        )}
        {renderReferralContent()}
        {renderMobileInstallContent()}
        {buttonLink && !audioToClaim && completedLabel ? (
          <Button
            variant='primary'
            fullWidth
            onClick={goToRoute}
            iconLeft={buttonInfo?.leftIcon}
            iconRight={buttonInfo?.rightIcon}
          >
            {challenge?.state === 'disbursed'
              ? completedLabel
              : buttonInfo?.label}
          </Button>
        ) : null}
        {audioToClaim > 0 ||
        (audioClaimedSoFar > 0 && challenge?.state !== 'disbursed') ? (
          <div className={wm(styles.claimRewardWrapper)}>
            {renderClaimButton()}
            {renderClaimedSoFarContent()}
          </div>
        ) : null}
        {errorContent}
      </Flex>
    )
  }
}

export const ChallengeRewardsModal = () => {
  const [modalType] = useRewardsModalType()
  const [isOpen, setOpen] = useModalState('ChallengeRewardsExplainer')
  const dispatch = useDispatch()
  const wm = useWithMobileStyle(styles.mobile)
  const onClose = useCallback(() => {
    setOpen(false)
    // Cancel any claims on close so that the state is fresh for other rewards
    dispatch(resetAndCancelClaimReward())
  }, [dispatch, setOpen])

  const { title, icon } = getChallengeConfig(modalType)

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
      showDismissButton
      dismissOnClickOutside
    >
      <ModalContent>
        <ChallengeRewardsBody dismissModal={onClose} />
      </ModalContent>
    </ModalDrawer>
  )
}
