import { useCallback } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import { Flex, IconTokenGold, Paper, Text, useTheme } from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { useIsMobile } from 'hooks/useIsMobile'

import { messages } from '../messages'

export const ClaimAllPanel = () => {
  const { iconSizes } = useTheme()
  const isMobile = useIsMobile() || window.innerWidth < 1080
  const { cooldownChallenges, cooldownAmount, claimableAmount } =
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
        border='strong'
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
            <Text variant='heading' size='s'>
              {claimable
                ? messages.claimAllRewards
                : messages.totalUpcomingRewards}
            </Text>
          </Flex>
          {cooldownChallenges.length > 0 && (
            <Text variant='body' size='m' color='subdued'>
              {formatCooldownChallenges(cooldownChallenges)}
            </Text>
          )}
        </Flex>
      </Paper>
    )
  }

  return (
    <Paper
      border='strong'
      alignItems='center'
      alignSelf='stretch'
      justifyContent='space-between'
      css={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      <Flex gap='s' alignItems='center'>
        {claimable ? (
          <IconTokenGold
            height={iconSizes.l}
            width={iconSizes.l}
            aria-label={messages.goldAudioToken}
          />
        ) : null}
        <Text variant='heading' size='s'>
          {claimable ? messages.claimAllRewards : messages.totalUpcomingRewards}
        </Text>
      </Flex>
      {cooldownChallenges.length > 0 && (
        <Text variant='body' size='m' color='subdued'>
          {formatCooldownChallenges(cooldownChallenges)}
        </Text>
      )}
    </Paper>
  )
}
