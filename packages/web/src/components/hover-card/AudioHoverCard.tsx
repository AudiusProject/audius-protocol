import { ReactNode } from 'react'

import { useAudioBalance, useCurrentUserId, useUser } from '@audius/common/api'
import { AudioTiers, BadgeTier, ID } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import {
  HoverCard,
  HoverCardHeader,
  IconArrowRight,
  IconComponent,
  IconTokenAUDIO,
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver,
  useTheme
} from '@audius/harmony'
import { Origin } from '@audius/harmony/src/components/popup/types'

import { HoverCardBody } from './HoverCardBody'

type AudioHoverCardProps = {
  /**
   * Content displayed as the hover trigger
   */
  children: ReactNode

  /**
   * The $AUDIO tier to display
   */
  tier: AudioTiers

  /**
   * The user ID to fetch balance and tier information for
   */
  userId: ID

  /**
   * Optional callback fired when the hover card is closed
   */
  onClose?: () => void

  /**
   * Position of the anchor origin
   */
  anchorOrigin?: Origin

  /**
   * Position of the transform origin
   */
  transformOrigin?: Origin

  /**
   * Optional callback fired when the hover card is clicked
   */
  onClick?: () => void
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
  onClick
}: AudioHoverCardProps) => {
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

  return (
    <HoverCard
      content={
        <>
          <HoverCardHeader
            iconLeft={audioTierBadgeMap[tier]}
            title={getBadgeName(tier)}
            onClose={onClose}
            iconRight={IconArrowRight}
          />
          <HoverCardBody
            icon={
              <IconTokenAUDIO
                size='3xl'
                css={{ borderRadius: cornerRadius.circle }}
              />
            }
            amount={formattedBalance}
          />
        </>
      }
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      onClick={onClick}
    >
      {children}
    </HoverCard>
  )
}
