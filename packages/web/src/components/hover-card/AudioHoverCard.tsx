import { useCallback } from 'react'

import { useAudioBalance, useCurrentUserId, useUser } from '@audius/common/api'
import { AudioTiers, BadgeTier, ID } from '@audius/common/models'
import { AUDIO_PAGE } from '@audius/common/src/utils/route'
import { formatCount } from '@audius/common/utils'
import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import {
  HoverCard,
  HoverCardHeader,
  HoverCardProps,
  IconArrowRight,
  IconComponent,
  IconTokenAUDIO,
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver,
  useTheme
} from '@audius/harmony'
import { useNavigate } from 'react-router-dom-v5-compat'

import { HoverCardBody } from './HoverCardBody'

type AudioHoverCardProps = Pick<
  HoverCardProps,
  | 'children'
  | 'onClose'
  | 'onClick'
  | 'anchorOrigin'
  | 'transformOrigin'
  | 'triggeredBy'
> & {
  /**
   * The $AUDIO tier to display
   */
  tier: AudioTiers

  /**
   * The user ID to fetch balance and tier information for
   */
  userId: ID
}

// Audio tier badge map for header icons
const audioTierBadgeMap: Record<AudioTiers, IconComponent> = {
  bronze: IconTokenBronze,
  silver: IconTokenSilver,
  gold: IconTokenGold,
  platinum: IconTokenPlatinum
}

const getBadgeName = (tier: BadgeTier) => {
  return `${tier} Badge`
}

const formatBalance = (balance: string | AudioWei | undefined | null) => {
  if (!balance) return '0'
  const audioValue = AUDIO(BigInt(balance))
  return formatCount(Number(audioValue.toFixed(2)))
}

/**
 * A complete HoverCard for $AUDIO badge tiers that includes both header and body
 */
export const AudioHoverCard = ({
  children,
  tier,
  userId,
  onClose,
  anchorOrigin,
  transformOrigin,
  onClick,
  triggeredBy
}: AudioHoverCardProps) => {
  const navigate = useNavigate()
  const { cornerRadius } = useTheme()

  // Get user's formatted balance directly using select
  const { data: userBalance = '0' } = useUser(userId, {
    select: (user) => formatBalance(user?.total_balance)
  })
  const { data: currentUserId } = useCurrentUserId()
  const isCurrentUser = currentUserId === userId
  const { accountBalance: currentUserBalance } = useAudioBalance()
  const formattedBalance = isCurrentUser
    ? formatBalance(currentUserBalance)
    : userBalance

  const handleClick = useCallback(() => {
    onClick?.()
    navigate(AUDIO_PAGE)
  }, [navigate, onClick])

  return (
    <HoverCard
      content={
        <>
          <HoverCardHeader
            iconLeft={audioTierBadgeMap[tier]}
            title={getBadgeName(tier)}
            onClick={handleClick}
            onClose={onClose}
            iconRight={IconArrowRight}
          />
          <HoverCardBody
            icon={
              <IconTokenAUDIO
                size='3xl'
                css={{ borderRadius: cornerRadius.circle }}
                hex
              />
            }
            amount={formattedBalance}
          />
        </>
      }
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      onClick={handleClick}
      triggeredBy={triggeredBy}
    >
      {children}
    </HoverCard>
  )
}
