import { useCallback, useEffect, useState } from 'react'

import type {
  ChallengeRewardID,
  ChallengeRewardsModalType,
  CommonState
} from '@audius/common'
import {
  removeNullable,
  StringKeys,
  challengesSelectors,
  audioRewardsPageActions,
  audioRewardsPageSelectors,
  modalsActions,
  makeOptimisticChallengeSortComparator
} from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import LoadingSpinner from 'app/components/loading-spinner'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
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
  'first-playlist'
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

  const userChallengesLoading = useSelector(getUserChallengesLoading)
  const userChallenges = useSelector(getUserChallenges)
  const optimisticUserChallenges = useSelector((state: CommonState) =>
    getOptimisticUserChallenges(state, true)
  )
  const [haveChallengesLoaded, setHaveChallengesLoaded] = useState(false)

  // The referred challenge only needs a tile if the user was referred
  const hideReferredTile = !userChallenges.referred?.is_complete
  const rewardIds = useRewardIds({ referred: hideReferredTile })

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
      return (
        <Panel
          {...props}
          challenge={optimisticUserChallenges[id]}
          onPress={() => openModal(id)}
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
