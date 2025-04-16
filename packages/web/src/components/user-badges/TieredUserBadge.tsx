import { useCallback, MouseEvent } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { walletSelectors } from '@audius/common/store'
import { formatWei, route } from '@audius/common/utils'
import { Box, IconSize } from '@audius/harmony'
import { Origin } from '@audius/harmony/src/components/popup/types'

import { AudioHoverCard } from 'components/hover-card/AudioHoverCard'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'

import UserBadges from './UserBadges'

const { AUDIO_PAGE } = route

type TieredUserBadgeProps = {
  userId: ID
  size?: IconSize
  className?: string
  isVerifiedOverride?: boolean
  anchorOrigin?: Origin
  transformOrigin?: Origin
}

/**
 * A component that renders UserBadges with an AudioHoverCard when the user has a tier
 */
export const TieredUserBadge = (props: TieredUserBadgeProps) => {
  const {
    userId,
    size,
    className,
    isVerifiedOverride,
    anchorOrigin,
    transformOrigin,
    ...otherUserBadgeProps
  } = props

  // Get tier and balance for the hover card
  const { tier } = useSelectTierInfo(userId)
  const totalBalance = useSelector(walletSelectors.getAccountTotalBalance)
  const formattedBalance = totalBalance ? formatWei(totalBalance, true) : '0'
  const navigate = useNavigateToPage()

  // Create a click handler that stops propagation and navigates to AUDIO page
  // We want the handler to execute when the HoverCard is clicked directly
  // and not bubble up to the parent components like UserLink
  const handleClick = useCallback(() => {
    navigate(AUDIO_PAGE)
  }, [navigate])

  // Create the UserBadges element with all props
  const badgesElement = (
    <UserBadges
      userId={userId}
      size={size}
      className={className}
      isVerifiedOverride={isVerifiedOverride}
      {...otherUserBadgeProps}
    />
  )

  // Only wrap with AudioHoverCard if user has a tier
  if (tier === 'none') {
    return badgesElement
  }

  return (
    <Box
      onClick={(e: MouseEvent) => e.stopPropagation()}
      css={{
        display: 'inline-block',
        position: 'relative',
        pointerEvents: 'auto'
      }}
    >
      <AudioHoverCard
        tier={tier}
        amount={formattedBalance}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        onClick={handleClick}
      >
        {badgesElement}
      </AudioHoverCard>
    </Box>
  )
}
