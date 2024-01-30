import { useCallback, useEffect, useState } from 'react'

import type { ChallengeRewardsModalType, CommonState } from '@audius/common'
import {
  removeNullable,
  StringKeys,
  challengesSelectors,
  audioRewardsPageActions,
  audioRewardsPageSelectors,
  modalsActions,
  makeOptimisticChallengeSortComparator,
  FeatureFlags
} from '@audius/common'
import { Name, ChallengeName } from '@audius/common/models'
import type { ChallengeRewardID } from '@audius/common/models'
import { useFocusEffect } from '@react-navigation/native'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import LoadingSpinner from 'app/components/loading-spinner'
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
  ChallengeName.AudioMatchingSell // $AUDIO matching seller
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

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    width: '100%',
    alignItems: 'stretch'
  },
  loading: {
    marginVertical: spacing(2)
  }
}))

export const ChallengeRewards = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { isEnabled: isAudioMatchingChallengesEnabled } = useFeatureFlag(
    FeatureFlags.AUDIO_MATCHING_CHALLENGES
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
    referred: hideReferredTile,
    b: !isAudioMatchingChallengesEnabled,
    s: !isAudioMatchingChallengesEnabled
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
        rewardsPanels
      )}
    </View>
  )
}
