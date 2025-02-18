import { useEffect, useMemo, useState } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { ChallengeName } from '@audius/common/src/models/AudioRewards'
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
import { Box, Flex, LoadingSpinner, Paper, Text } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { getChallengeConfig } from 'pages/rewards-page/config'

import styles from '../../RewardsTile.module.css'
import { messages } from '../../messages'
import { ClaimAllRewardsPanel } from '../ClaimAllRewardsPanel'

import { RewardPanel } from './RewardPanel'
import { useRewardIds } from './hooks/useRewardIds'

const { getUserChallenges, getUserChallengesLoading } =
  audioRewardsPageSelectors
const { fetchUserChallenges, setChallengeRewardsModalType } =
  audioRewardsPageActions
const { getOptimisticUserChallenges } = challengesSelectors

type ChallengeRewardsTileProps = {
  className?: string
}

export const ChallengeRewardsTile = ({
  className
}: ChallengeRewardsTileProps) => {
  const setVisibility = useSetVisibility()
  const dispatch = useDispatch()
  const userChallengesLoading = useSelector(getUserChallengesLoading)
  const userChallenges = useSelector(getUserChallenges)
  const optimisticUserChallenges = useSelector(getOptimisticUserChallenges)
  const [haveChallengesLoaded, setHaveChallengesLoaded] = useState(false)
  const { isEnabled: isOneShotEnabled } = useFeatureFlag(FeatureFlags.ONE_SHOT)
  const { isEnabled: isClaimAllRewardsEnabled } = useFeatureFlag(
    FeatureFlags.CLAIM_ALL_REWARDS_TILE
  )

  // The referred challenge only needs a tile if the user was referred
  const hideReferredTile = !userChallenges.referred?.is_complete
  const rewardIds = useRewardIds({
    referred: hideReferredTile,
    [ChallengeName.Referred]: hideReferredTile
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
        .filter((id) =>
          isOneShotEnabled ? true : id !== ChallengeName.OneShot
        )
        .sort(makeOptimisticChallengeSortComparator(optimisticUserChallenges)),
    [rewardIds, optimisticUserChallenges, userChallenges, isOneShotEnabled]
  )

  const rewardsTiles = rewardIdsSorted.map((id) => {
    const props = getChallengeConfig(id)
    return <RewardPanel {...props} openModal={openModal} key={props.id} />
  })

  const wm = useWithMobileStyle(styles.mobile)
  const isMobile = useIsMobile()

  return (
    <Flex direction='column' gap='l'>
      {isClaimAllRewardsEnabled ? <ClaimAllRewardsPanel /> : null}
      <Paper column p={isMobile ? 'm' : 'xl'} css={{ minHeight: 1000 }}>
        <Text variant='display' size='s' className={wm(styles.title)}>
          {messages.title}
        </Text>
        <Box mb='3xl'>
          <Text variant='body' strength='strong' size='l'>
            {messages.description1}
          </Text>
        </Box>
        {userChallengesLoading && !haveChallengesLoaded ? (
          <Box
            h='unit10'
            w='unit10'
            css={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <LoadingSpinner />
          </Box>
        ) : (
          <Flex wrap='wrap' gap='l'>
            {rewardsTiles}
          </Flex>
        )}
      </Paper>
    </Flex>
  )
}
