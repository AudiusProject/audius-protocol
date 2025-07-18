import {
  cloneElement,
  MouseEvent,
  ReactElement,
  useCallback,
  useMemo
} from 'react'

import { useTokenBalance } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { BadgeTier, ID } from '@audius/common/models'
import { FeatureFlags, getTokenBySymbol } from '@audius/common/services'
import { useTierAndVerifiedForUser } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import {
  Box,
  Flex,
  HoverCard,
  IconSize,
  iconSizes,
  IconTokenBonk,
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver,
  IconVerified,
  Text,
  motion
} from '@audius/harmony'
import { Origin } from '@audius/harmony/src/components/popup/types'
import cn from 'classnames'

import { ArtistCoinHoverCard } from 'components/hover-card/ArtistCoinHoverCard'
import { AudioHoverCard } from 'components/hover-card/AudioHoverCard'
import { env } from 'services/env'

import styles from './UserBadges.module.css'

export const audioTierMap: {
  [tier in BadgeTier]: Nullable<ReactElement>
} = {
  none: null,
  bronze: <IconTokenBronze />,
  silver: <IconTokenSilver />,
  gold: <IconTokenGold />,
  platinum: <IconTokenPlatinum />
}

type UserBadgesProps = {
  userId: ID
  size?: IconSize
  className?: string
  inline?: boolean
  anchorOrigin?: Origin
  transformOrigin?: Origin

  // Normally, user badges is not a controlled component and selects
  // badges off of the store. The override allows for it to be used
  // in a controlled context where the desired store state is not available.
  isVerifiedOverride?: boolean
  overrideTier?: BadgeTier
}

/**
 * A component that renders user badges (verified and audio tier) with appropriate hover cards
 */
const UserBadges = ({
  userId,
  size = 'xs',
  className,
  inline = false,
  anchorOrigin,
  transformOrigin,
  isVerifiedOverride,
  overrideTier
}: UserBadgesProps) => {
  const { tier: currentTier, isVerified } = useTierAndVerifiedForUser(userId)
  const { isEnabled: isArtistCoinEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  // TODO: PE-6541 Show artist coin for which user has highest balance
  const bonkToken = getTokenBySymbol(env, 'BONK')
  const bonkMint = bonkToken?.address
  const { data: coinBalance } = useTokenBalance({
    token: 'BONK'
  })

  const tier = overrideTier || currentTier
  const isUserVerified = isVerifiedOverride ?? isVerified
  const hasContent = isUserVerified || tier !== 'none' || !!coinBalance

  // Create a handler to stop event propagation
  const handleStopPropagation = useCallback((e: MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Wrap the verified badge with a HoverCard
  const verifiedBadge = useMemo(() => {
    if (!isUserVerified) return null

    return (
      <HoverCard
        triggeredBy='both'
        content={
          <Flex alignItems='center' justifyContent='center' gap='s' p='s'>
            <IconVerified size='l' />
            <Text variant='title' size='l'>
              Verified
            </Text>
          </Flex>
        }
      >
        <Box
          css={{
            cursor: 'pointer',
            transition: `opacity ${motion.quick}`,
            '&:hover': {
              opacity: 0.6
            }
          }}
        >
          <IconVerified height={iconSizes[size]} width={iconSizes[size]} />
        </Box>
      </HoverCard>
    )
  }, [isUserVerified, size])

  // Get the tier badge and wrap it with AudioHoverCard if user has a tier
  const tierBadge = useMemo(() => {
    if (tier === 'none') return null

    return (
      <AudioHoverCard
        tier={tier}
        userId={userId}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        triggeredBy='both'
      >
        <Box
          css={{
            cursor: 'pointer',
            transition: `opacity ${motion.quick}`,
            '&:hover': {
              opacity: 0.6
            }
          }}
        >
          {cloneElement(audioTierMap[tier]!, { size })}
        </Box>
      </AudioHoverCard>
    )
  }, [tier, userId, anchorOrigin, transformOrigin, size])

  const shouldShowArtistCoinBadge =
    !!coinBalance &&
    !!bonkMint &&
    isArtistCoinEnabled &&
    coinBalance.value !== BigInt(0)

  const artistCoinBadge = useMemo(() => {
    if (!shouldShowArtistCoinBadge) return null

    return (
      <ArtistCoinHoverCard
        mint={bonkMint}
        userId={userId}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        triggeredBy='both'
      >
        <Box
          css={{
            cursor: 'pointer',
            transition: `opacity ${motion.quick}`,
            '&:hover': {
              opacity: 0.6
            }
          }}
        >
          <IconTokenBonk size={size} hex />
        </Box>
      </ArtistCoinHoverCard>
    )
  }, [
    shouldShowArtistCoinBadge,
    bonkMint,
    userId,
    anchorOrigin,
    transformOrigin,
    size
  ])

  if (!hasContent) return null

  return (
    <Box
      onClick={handleStopPropagation}
      css={{
        display: 'inline-block',
        position: 'relative',
        pointerEvents: 'auto'
      }}
    >
      <span
        className={cn(
          {
            [styles.inlineContainer]: inline,
            [styles.container]: !inline
          },
          className
        )}
      >
        {verifiedBadge}
        {tierBadge}
        {artistCoinBadge}
      </span>
    </Box>
  )
}

export default UserBadges
