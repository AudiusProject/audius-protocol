import { cloneElement, MouseEvent, ReactElement, useCallback } from 'react'

import { BadgeTier, ID } from '@audius/common/models'
import { useTierAndVerifiedForUser } from '@audius/common/store'
import { Nullable, route } from '@audius/common/utils'
import {
  Box,
  Flex,
  HoverCard,
  IconSize,
  iconSizes,
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

import { AudioHoverCard } from 'components/hover-card/AudioHoverCard'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import { HexagonalIcon } from './HexagonalIcon'
import styles from './UserBadges.module.css'

const { AUDIO_PAGE } = route

// Create a unique ID for the clip path
const clipPathId = 'hexagonal-badge-clip'

const HexagonalMask = () => (
  <svg width='0' height='0' style={{ position: 'absolute' }}>
    <defs>
      <clipPath id={clipPathId} clipPathUnits='objectBoundingBox'>
        <path
          // transform='translate(0 0.13)'
          d='M0.966 0.378C0.93 0.301 0.887 0.228 0.839 0.158L0.824 0.136C0.805 0.108 0.779 0.085 0.75 0.068C0.721 0.051 0.688 0.041 0.655 0.039L0.627 0.036C0.543 0.03 0.457 0.03 0.373 0.036L0.346 0.039C0.312 0.041 0.279 0.051 0.25 0.068C0.221 0.085 0.196 0.108 0.177 0.136L0.161 0.158C0.113 0.228 0.07 0.302 0.034 0.378L0.022 0.403C0.008 0.433 0 0.466 0 0.5C0 0.534 0.008 0.567 0.022 0.597L0.034 0.622C0.07 0.698 0.113 0.772 0.161 0.842L0.177 0.864C0.196 0.892 0.221 0.915 0.25 0.932C0.279 0.949 0.312 0.959 0.346 0.961L0.373 0.964C0.457 0.97 0.543 0.97 0.627 0.964L0.655 0.961C0.688 0.959 0.721 0.949 0.75 0.932C0.779 0.915 0.805 0.892 0.824 0.864L0.839 0.842C0.887 0.772 0.93 0.698 0.966 0.622L0.978 0.597C0.992 0.567 1 0.534 1 0.5C1 0.466 0.992 0.433 0.978 0.403L0.966 0.378Z'
        />
      </clipPath>
    </defs>
  </svg>
)

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
  const tier = overrideTier || currentTier
  const isUserVerified = isVerifiedOverride ?? isVerified
  const hasContent = isUserVerified || tier !== 'none'

  const navigate = useNavigateToPage()

  // Create a click handler that stops propagation and navigates to AUDIO page
  const handleClick = useCallback(() => {
    navigate(AUDIO_PAGE)
  }, [navigate])

  // Create a handler to stop event propagation
  const handleStopPropagation = useCallback((e: MouseEvent) => {
    e.stopPropagation()
  }, [])

  if (!hasContent) return null

  // Wrap the verified badge with a HoverCard
  const verifiedBadge = isUserVerified ? (
    <HoverCard
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
  ) : null

  // Get the tier badge and wrap it with AudioHoverCard if user has a tier
  const tierBadge =
    tier !== 'none' ? (
      <AudioHoverCard
        tier={tier}
        userId={userId}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        onClick={handleClick}
      >
        <Box
          css={{
            cursor: 'pointer',
            transition: `opacity ${motion.quick}`,
            '&:hover': {
              opacity: 0.6
            },
            width: iconSizes[size],
            height: iconSizes[size]
          }}
        >
          {cloneElement(audioTierMap[tier]!, { size })}
        </Box>
      </AudioHoverCard>
    ) : null

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
        {tierBadge ? (
          // <Box
          //   css={{
          //     display: 'inline-flex',
          //     alignItems: 'center',
          //     justifyContent: 'center',
          //     clipPath: `url(#${clipPathId})`,
          //     position: 'relative',
          //     width: iconSizes[size],
          //     height: iconSizes[size]
          //   }}
          // >
          //   <HexagonalMask />
          //   {tierBadge}
          // </Box>
          <HexagonalIcon size={size}>{tierBadge}</HexagonalIcon>
        ) : null}
      </span>
    </Box>
  )
}

export default UserBadges
