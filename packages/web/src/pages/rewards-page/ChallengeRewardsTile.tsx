import { useEffect, useMemo, useState } from 'react'

import { useChallengeCooldownSchedule } from '@audius/common/hooks'
import {
  audioRewardsPageActions,
  audioRewardsPageSelectors,
  ChallengeRewardsModalType,
  challengesSelectors
} from '@audius/common/store'
import {
  makeOptimisticChallengeSortComparator,
  removeNullable
} from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './RewardsTile.module.css'
import { ClaimAllPanel } from './components/ClaimAllPanel'
import { RewardPanel } from './components/RewardPanel'
import { Tile } from './components/Tile'
import { getChallengeConfig } from './config'
import { useRewardIds } from './hooks/useRewardIds'
import { messages } from './messages'

const { getUserChallenges, getUserChallengesLoading } =
  audioRewardsPageSelectors
const { fetchUserChallenges, setChallengeRewardsModalType } =
  audioRewardsPageActions
const { getOptimisticUserChallenges } = challengesSelectors

type RewardsTileProps = {
  className?: string
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
    <Flex direction='column' gap='l'>
      {!shouldHideCumulativeRewards ? <ClaimAllPanel /> : null}
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
            <div className={styles.rewardsContainer}>{rewardsTiles}</div>
          </>
        )}
      </Tile>
    </Flex>
  )
}

export default RewardsTile
