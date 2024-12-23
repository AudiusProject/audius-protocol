import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule,
  useFormattedProgressLabel
} from '@audius/common/hooks'
import {
  Name,
  ChallengeName,
  ChallengeRewardID,
  OptimisticUserChallenge
} from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  challengesSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  ChallengeRewardsModalType
} from '@audius/common/store'
import {
  removeNullable,
  makeOptimisticChallengeSortComparator,
  isAudioMatchingChallenge,
  dayjs
} from '@audius/common/utils'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconArrowRight as IconArrow,
  IconCheck,
  IconTokenGold,
  Paper,
  PlainButton,
  ProgressBar,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState, useSetVisibility } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { SummaryTableItem } from 'components/summary-table'
import { useIsMobile } from 'hooks/useIsMobile'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { make, track } from 'services/analytics'

import styles from './RewardsTile.module.css'
import { Tile } from './components/ExplainerTile'
import { getChallengeConfig } from './config'
const { getUserChallenges, getUserChallengesLoading } =
  audioRewardsPageSelectors
const { fetchUserChallenges, setChallengeRewardsModalType } =
  audioRewardsPageActions
const { getOptimisticUserChallenges } = challengesSelectors

type ClaimableSummaryTableItem = SummaryTableItem & {
  claimableDate: dayjs.Dayjs
  isClose: boolean
}

const messages = {
  title: 'EARN REWARDS',
  description1: 'Complete tasks to earn $AUDIO tokens!',
  completeLabel: 'COMPLETE',
  claimReward: 'Claim This Reward',
  claimAllRewards: 'Claim All Rewards',
  moreInfo: 'More Info',
  readyToClaim: 'Ready to Claim',
  pendingRewards: 'Pending Reward',
  totalUpcomingRewards: 'Total Upcoming Rewards',
  totalReadyToClaim: 'Total Ready To Claim',
  pending: 'Pending',
  viewDetails: 'View Details',
  new: 'New!',
  goldAudioToken: 'Gold $AUDIO token',
  available: '$AUDIO available',
  now: 'now!',
  availableMessage: (summaryItems: ClaimableSummaryTableItem[]) => {
    const filteredSummaryItems = summaryItems.filter(removeNullable)
    const summaryItem = filteredSummaryItems.pop()
    const { value, label, claimableDate, isClose } = (summaryItem ??
      {}) as ClaimableSummaryTableItem
    if (isClose) {
      return `${value} ${messages.available} ${label}`
    }
    return (
      <Text>
        {value} {messages.available} {label}&nbsp;
        <Text color='subdued'>{claimableDate.format('(M/D)')}</Text>
      </Text>
    )
  }
}

type RewardPanelProps = {
  title: string
  icon: ReactNode
  description: (challenge?: OptimisticUserChallenge) => string
  panelButtonText: string
  progressLabel?: string
  remainingLabel?: string
  openModal: (modalType: ChallengeRewardsModalType) => void
  id: ChallengeRewardID
}

const RewardPanel = ({
  id,
  title,
  description,
  panelButtonText,
  openModal,
  progressLabel,
  remainingLabel,
  icon
}: RewardPanelProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const userChallenges = useSelector(getOptimisticUserChallenges)

  const openRewardModal = () => {
    openModal(id)
    track(
      make({ eventName: Name.REWARDS_CLAIM_DETAILS_OPENED, challengeId: id })
    )
  }

  const challenge = userChallenges[id]
  const hasDisbursed = challenge?.state === 'disbursed'
  const needsDisbursement = challenge && challenge.claimableAmount > 0
  const shouldShowProgressBar =
    challenge &&
    challenge.max_steps &&
    challenge.max_steps > 1 &&
    challenge.challenge_type !== 'aggregate' &&
    !hasDisbursed
  const showNewChallengePill =
    isAudioMatchingChallenge(id) && !needsDisbursement

  const formattedProgressLabel: string = useFormattedProgressLabel({
    challenge,
    progressLabel,
    remainingLabel
  })

  const buttonMessage = needsDisbursement
    ? messages.claimReward
    : hasDisbursed
      ? messages.viewDetails
      : panelButtonText

  const buttonVariant = 'secondary'

  return (
    <div
      className={wm(
        cn(styles.rewardPanelContainer, hasDisbursed ? styles.disbursed : '')
      )}
      onClick={openRewardModal}
    >
      <div className={wm(styles.rewardPanelTop)}>
        <div className={wm(styles.rewardPillContainer)}>
          {needsDisbursement ? (
            <span className={styles.pillMessage}>{messages.readyToClaim}</span>
          ) : showNewChallengePill ? (
            <Text
              tag='span'
              className={styles.newChallengePill}
              variant='body'
              strength='strong'
              color='staticWhite'
            >
              {messages.new}
            </Text>
          ) : null}
        </div>
        <span className={wm(styles.rewardTitle)}>
          {icon}
          {title}
        </span>
        <span className={wm(styles.rewardDescription)}>
          {description(challenge)}
        </span>
      </div>
      <div className={wm(styles.rewardPanelBottom)}>
        <div className={wm(styles.rewardProgress)}>
          {needsDisbursement && <IconCheck className={wm(styles.iconCheck)} />}
          <p className={styles.rewardProgressLabel}>{formattedProgressLabel}</p>
          {shouldShowProgressBar && challenge.max_steps && (
            <ProgressBar
              className={styles.rewardProgressBar}
              value={challenge?.current_step_count ?? 0}
              max={challenge?.max_steps}
            />
          )}
        </div>
        <Button
          variant={buttonVariant}
          size='small'
          iconRight={hasDisbursed ? null : IconArrow}
          onClick={openRewardModal}
          fullWidth
        >
          {buttonMessage}
        </Button>
      </div>
    </div>
  )
}

const ClaimAllPanel = () => {
  const isMobile = useIsMobile() || window.innerWidth < 1080
  const wm = useWithMobileStyle(styles.mobile)
  const { cooldownChallenges, cooldownAmount, claimableAmount, isEmpty } =
    useChallengeCooldownSchedule({ multiple: true })
  const claimable = claimableAmount > 0
  const [, setClaimAllRewardsVisibility] = useModalState('ClaimAllRewards')
  const onClickClaimAllRewards = useCallback(() => {
    setClaimAllRewardsVisibility(true)
  }, [setClaimAllRewardsVisibility])
  const onClickMoreInfo = useCallback(() => {
    setClaimAllRewardsVisibility(true)
  }, [setClaimAllRewardsVisibility])
  const handleClick = useCallback(() => {
    if (claimable) {
      onClickClaimAllRewards()
    } else if (cooldownAmount > 0) {
      onClickMoreInfo()
    }
  }, [claimable, cooldownAmount, onClickClaimAllRewards, onClickMoreInfo])

  if (isMobile) {
    return (
      <Paper
        shadow='flat'
        border='strong'
        p='xl'
        alignItems='center'
        alignSelf='stretch'
        justifyContent='space-between'
        css={{ cursor: 'pointer' }}
        onClick={handleClick}
      >
        <Flex direction='column' alignItems='start' w='100%'>
          <Flex gap='s' alignItems='center'>
            {claimable ? (
              <IconTokenGold
                height={24}
                width={24}
                aria-label={messages.goldAudioToken}
              />
            ) : null}
            {isEmpty ? null : (
              <Text color='accent' variant='title' size='l'>
                {claimable
                  ? messages.totalReadyToClaim
                  : messages.totalUpcomingRewards}
              </Text>
            )}
          </Flex>
          {cooldownAmount > 0 ? (
            <Box
              mt='m'
              backgroundColor='default'
              pv='2xs'
              ph='s'
              borderRadius='l'
            >
              <Text color='accent' variant='body' size='s' strength='strong'>
                {cooldownAmount} {messages.pending}
              </Text>
            </Box>
          ) : null}
          <Box mt='l' mb='xl'>
            <Text variant='body' textAlign='left' size='s'>
              {claimable
                ? `${claimableAmount} ${messages.available} ${messages.now}`
                : messages.availableMessage(
                    formatCooldownChallenges(cooldownChallenges)
                  )}
            </Text>
          </Box>
          {claimable ? (
            <Button
              onClick={onClickClaimAllRewards}
              iconRight={IconArrow}
              fullWidth
            >
              {messages.claimAllRewards}
            </Button>
          ) : cooldownAmount > 0 ? (
            <PlainButton
              size='large'
              onClick={onClickMoreInfo}
              iconRight={IconArrow}
              fullWidth
            >
              {messages.moreInfo}
            </PlainButton>
          ) : null}
        </Flex>
      </Paper>
    )
  }

  return (
    <Paper
      shadow='flat'
      border='strong'
      p='xl'
      alignItems='center'
      alignSelf='stretch'
      justifyContent='space-between'
      m='s'
      css={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      <Flex gap='l' alignItems='center'>
        {claimableAmount > 0 ? (
          <IconTokenGold
            height={48}
            width={48}
            aria-label={messages.goldAudioToken}
          />
        ) : null}
        <Flex direction='column'>
          <Flex>
            {isEmpty ? null : (
              <Text color='accent' size='m' variant='heading'>
                {claimableAmount > 0
                  ? messages.totalReadyToClaim
                  : messages.totalUpcomingRewards}
              </Text>
            )}
            {cooldownAmount > 0 ? (
              <div className={wm(styles.pendingPillContainer)}>
                <span className={styles.pillMessage}>
                  {cooldownAmount} {messages.pending}
                </span>
              </div>
            ) : null}
          </Flex>
          <Text variant='body' textAlign='left'>
            {claimableAmount > 0
              ? `${claimableAmount} ${messages.available} ${messages.now}`
              : messages.availableMessage(
                  formatCooldownChallenges(cooldownChallenges)
                )}
          </Text>
        </Flex>
      </Flex>
      {claimableAmount > 0 ? (
        <Button onClick={onClickClaimAllRewards} iconRight={IconArrow}>
          {messages.claimAllRewards}
        </Button>
      ) : cooldownAmount > 0 ? (
        <PlainButton
          size='large'
          onClick={onClickMoreInfo}
          iconRight={IconArrow}
        >
          {messages.moreInfo}
        </PlainButton>
      ) : null}
    </Paper>
  )
}

type RewardsTileProps = {
  className?: string
}

const validRewardIds: Set<ChallengeRewardID> = new Set([
  'track-upload',
  'referrals',
  'ref-v',
  'mobile-install',
  'connect-verified',
  'listen-streak',
  'profile-completion',
  'referred',
  'send-first-tip',
  'first-playlist',
  ChallengeName.AudioMatchingSell, // $AUDIO matching seller
  ChallengeName.AudioMatchingBuy, // $AUDIO matching buyer
  ChallengeName.ConnectVerified,
  ChallengeName.FirstPlaylist,
  ChallengeName.FirstTip,
  ChallengeName.MobileInstall,
  ChallengeName.ProfileCompletion,
  ChallengeName.Referrals,
  ChallengeName.ReferralsVerified,
  ChallengeName.Referred,
  ChallengeName.TrackUpload
])

/** Pulls rewards from remoteconfig */
const useRewardIds = (
  hideConfig: Partial<Record<ChallengeRewardID, boolean>>
) => {
  const rewardsString = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  if (rewardsString === null) return []
  const rewards = rewardsString.split(',') as ChallengeRewardID[]
  const filteredRewards: ChallengeRewardID[] = rewards.filter(
    (reward) => validRewardIds.has(reward) && !hideConfig[reward]
  )
  return filteredRewards
}

const RewardsTile = ({ className }: RewardsTileProps) => {
  const setVisibility = useSetVisibility()
  const dispatch = useDispatch()
  const userChallengesLoading = useSelector(getUserChallengesLoading)
  const userChallenges = useSelector(getUserChallenges)
  const optimisticUserChallenges = useSelector(getOptimisticUserChallenges)
  const [haveChallengesLoaded, setHaveChallengesLoaded] = useState(false)

  // The referred challenge only needs a tile if the user was referred
  const hideReferredTile = !userChallenges.referred?.is_complete
  const rewardIds = useRewardIds({
    referred: hideReferredTile
  })

  useEffect(() => {
    if (!userChallengesLoading && !haveChallengesLoaded) {
      setHaveChallengesLoaded(true)
    }
  }, [userChallengesLoading, haveChallengesLoaded])

  useEffect(() => {
    // Refresh user challenges on page visit
    dispatch(fetchUserChallenges())
  }, [dispatch])

  const openModal = (modalType: ChallengeRewardsModalType) => {
    dispatch(setChallengeRewardsModalType({ modalType }))
    setVisibility('ChallengeRewardsExplainer')(true)
  }

  const rewardIdsSorted = useMemo(
    () =>
      rewardIds
        // Filter out challenges that DN didn't return
        .map((id) => userChallenges[id]?.challenge_id)
        .filter(removeNullable)
        .sort(makeOptimisticChallengeSortComparator(optimisticUserChallenges)),
    [rewardIds, userChallenges, optimisticUserChallenges]
  )

  const rewardsTiles = rewardIdsSorted.map((id) => {
    const props = getChallengeConfig(id)
    return <RewardPanel {...props} openModal={openModal} key={props.id} />
  })

  const wm = useWithMobileStyle(styles.mobile)

  const { isEmpty: shouldHideCumulativeRewards } = useChallengeCooldownSchedule(
    {
      multiple: true
    }
  )

  return (
    <Tile className={wm(styles.rewardsTile, className)}>
      <span className={wm(styles.title)}>{messages.title}</span>
      <div className={wm(styles.subtitle)}>
        <Text variant='body' strength='strong'>
          {messages.description1}
        </Text>
      </div>
      {userChallengesLoading && !haveChallengesLoaded ? (
        <LoadingSpinner className={wm(styles.loadingRewardsTile)} />
      ) : (
        <>
          {!shouldHideCumulativeRewards ? (
            <>
              <ClaimAllPanel />
              <Divider className={wm(styles.divider)} />
            </>
          ) : null}
          <div className={styles.rewardsContainer}>{rewardsTiles}</div>
        </>
      )}
    </Tile>
  )
}

export default RewardsTile
