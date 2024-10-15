import { useCallback, useEffect, useState } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import { Name, ChallengeName } from '@audius/common/models'
import type { ChallengeRewardID } from '@audius/common/models'
import { StringKeys, FeatureFlags } from '@audius/common/services'
import {
  challengesSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  modalsActions
} from '@audius/common/store'
import type {
  ChallengeRewardsModalType,
  CommonState
} from '@audius/common/store'
import type { dayjs } from '@audius/common/utils'
import {
  removeNullable,
  makeOptimisticChallengeSortComparator
} from '@audius/common/utils'
import { useFocusEffect } from '@react-navigation/native'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  Text,
  Button,
  IconTokenGold,
  Paper,
  Divider,
  IconArrowRight
} from '@audius/harmony-native'
import LoadingSpinner from 'app/components/loading-spinner'
import type { SummaryTableItem } from 'app/components/summary-table/SummaryTable'
import { useFeatureFlag, useRemoteVar } from 'app/hooks/useRemoteConfig'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { getChallengeConfig } from 'app/utils/challenges'

import { Panel } from './Panel'
const { setVisibility } = modalsActions
const { getUserChallenges, getUserChallengesLoading } =
  audioRewardsPageSelectors
const { fetchUserChallenges, setChallengeRewardsModalType } =
  audioRewardsPageActions
const { getOptimisticUserChallenges } = challengesSelectors

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
  ChallengeName.AudioMatchingBuy, // $AUDIO matching buyer
  ChallengeName.AudioMatchingSell, // $AUDIO matching seller
  ChallengeName.ConnectVerified,
  ChallengeName.FirstPlaylist,
  ChallengeName.FirstTip,
  ChallengeName.ListenStreak,
  ChallengeName.MobileInstall,
  ChallengeName.ProfileCompletion,
  ChallengeName.Referrals,
  ChallengeName.ReferralsVerified,
  ChallengeName.Referred,
  ChallengeName.TrackUpload
])

type ClaimableSummaryTableItem = SummaryTableItem & {
  claimableDate: dayjs.Dayjs
  isClose: boolean
}

const messages = {
  pending: 'Pending',
  claimAllRewards: 'Claim All Rewards',
  moreInfo: 'More Info',
  available: '$AUDIO available',
  now: 'now!',
  totalReadyToClaim: 'Total Ready to Claim',
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

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    width: '100%',
    alignItems: 'stretch'
  },
  loading: {
    marginVertical: spacing(2)
  },
  pillContainer: {
    height: spacing(6),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  pillMessage: {
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.demiBold,
    lineHeight: spacing(4),
    color: palette.secondary,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: palette.backgroundSecondary,
    overflow: 'hidden'
  },
  readyToClaimPill: {
    backgroundColor: palette.background
  }
}))

export const ChallengeRewards = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { cooldownChallenges, cooldownAmount, claimableAmount, isEmpty } =
    useChallengeCooldownSchedule({ multiple: true })
  const { isEnabled: isRewardsCooldownEnabled } = useFeatureFlag(
    FeatureFlags.REWARDS_COOLDOWN
  )

  const userChallengesLoading = useSelector(getUserChallengesLoading)
  const userChallenges = useSelector(getUserChallenges)
  const optimisticUserChallenges = useSelector((state: CommonState) =>
    getOptimisticUserChallenges(state, true)
  )
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

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUserChallenges())
    }, [dispatch])
  )

  const openModal = (modalType: ChallengeRewardsModalType) => {
    dispatch(setChallengeRewardsModalType({ modalType }))
    dispatch(
      setVisibility({ modal: 'ChallengeRewardsExplainer', visible: true })
    )
  }

  const openClaimAllModal = () => {
    dispatch(setVisibility({ modal: 'ClaimAllRewards', visible: true }))
  }

  const rewardsPanels = rewardIds
    // Filter out challenges that DN didn't return
    .map((id) => userChallenges[id]?.challenge_id)
    .filter(removeNullable)
    .sort(makeOptimisticChallengeSortComparator(optimisticUserChallenges))
    .map((id) => {
      const props = getChallengeConfig(id)
      const onPress = () => {
        openModal(id)
        track(
          make({
            eventName: Name.REWARDS_CLAIM_DETAILS_OPENED,
            challengeId: id
          })
        )
      }
      return (
        <Panel
          {...props}
          challenge={optimisticUserChallenges[id]}
          onPress={onPress}
          key={props.title}
        />
      )
    })

  return (
    <View style={styles.root}>
      {userChallengesLoading && !haveChallengesLoaded ? (
        <LoadingSpinner style={styles.loading} />
      ) : (
        <Flex gap='2xl'>
          {isRewardsCooldownEnabled && !isEmpty ? (
            <Paper shadow='flat' border='strong' p='l' gap='m'>
              <Flex direction='row' justifyContent='flex-start' gap='s'>
                {claimableAmount > 0 ? (
                  <IconTokenGold height={24} width={24} />
                ) : null}
                <Text variant='heading' color='accent' size='s'>
                  {messages.totalReadyToClaim}
                </Text>
              </Flex>
              {cooldownAmount > 0 ? (
                <View style={styles.pillContainer}>
                  <Text style={[styles.pillMessage, styles.readyToClaimPill]}>
                    {cooldownAmount} {messages.pending}
                  </Text>
                </View>
              ) : null}
              <Text size='s' variant='body'>
                {claimableAmount > 0
                  ? `${claimableAmount} ${messages.available} ${messages.now}`
                  : messages.availableMessage(
                      formatCooldownChallenges(cooldownChallenges)
                    )}
              </Text>
              {claimableAmount > 0 ? (
                <Button
                  onPress={openClaimAllModal}
                  iconRight={IconArrowRight}
                  size='small'
                >
                  {messages.claimAllRewards}
                </Button>
              ) : cooldownAmount > 0 ? (
                <Button
                  variant='secondary'
                  onPress={openClaimAllModal}
                  iconRight={IconArrowRight}
                  size='small'
                >
                  {messages.moreInfo}
                </Button>
              ) : null}
            </Paper>
          ) : null}
          <Divider orientation='horizontal' />
          <Flex>{rewardsPanels}</Flex>
        </Flex>
      )}
    </View>
  )
}
