import type { TrendingRewardsModalType, Modals } from '@audius/common/store'
import { audioRewardsPageActions, modalsActions } from '@audius/common/store'

import type { ChallengeRewardID } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { getChallengeConfig } from 'app/utils/challenges'

import { Panel } from './Panel'
const { setVisibility } = modalsActions
const { setTrendingRewardsModalType } = audioRewardsPageActions

const validRewardIds: Set<ChallengeRewardID> = new Set([
  'trending-track',
  'trending-playlist',
  'top-api',
  'verified-upload',
  'trending-underground'
])

/** Pulls rewards from remoteconfig */
const useRewardIds = () => {
  const rewardsString = useRemoteVar(StringKeys.TRENDING_REWARD_IDS)
  if (!rewardsString) return []
  const rewards = rewardsString.split(',') as ChallengeRewardID[]
  const filteredRewards: ChallengeRewardID[] = rewards.filter((reward) =>
    validRewardIds.has(reward)
  )
  return filteredRewards
}

export const TrendingRewards = () => {
  const dispatch = useDispatch()

  const rewardIds = useRewardIds()

  const openModal = (trendingRewardId: ChallengeRewardID) => {
    let modal: Modals
    let modalType: TrendingRewardsModalType | null = null
    switch (trendingRewardId) {
      case 'top-api':
        modal = 'APIRewardsExplainer'
        break
      case 'trending-playlist':
        modal = 'TrendingRewardsExplainer'
        modalType = 'playlists'
        break
      case 'trending-track':
        modal = 'TrendingRewardsExplainer'
        modalType = 'tracks'
        break
      case 'trending-underground':
        modal = 'TrendingRewardsExplainer'
        modalType = 'underground'
        break
      case 'verified-upload':
      default:
        // Deprecated trending challenge
        return
    }
    if (modalType) {
      dispatch(setTrendingRewardsModalType({ modalType }))
    }
    dispatch(setVisibility({ modal, visible: true }))
  }

  const rewardsPanels = rewardIds.map((id) => {
    const props = getChallengeConfig(id)
    return <Panel {...props} onPress={() => openModal(id)} key={props.title} />
  })
  return <View>{rewardsPanels}</View>
}
