import { ReactNode } from 'react'

import { useUser } from '@audius/common/api'
import { BadgeTier, AudioTiers, ID } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
import {
  IconTokenBronze,
  IconTokenSilver,
  IconTokenGold,
  IconTokenPlatinum,
  HoverCardHeader,
  HoverCard,
  IconLogoCircle,
  IconArrowRight
} from '@audius/harmony'
import { Origin } from '@audius/harmony/src/components/popup/types'
import BN from 'bn.js'

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
const audioTierBadgeMap: Record<AudioTiers, JSX.Element> = {
  bronze: <IconTokenBronze size='l' />,
  silver: <IconTokenSilver size='l' />,
  gold: <IconTokenGold size='l' />,
  platinum: <IconTokenPlatinum size='l' />
}

const getBadgeName = (tier: BadgeTier) => {
  return `${tier} Badge`
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
  // Get user's formatted balance directly using select
  const { data: formattedBalance = '0' } = useUser(userId, {
    select: (user) => {
      if (!user?.total_balance) return '0'
      const balanceValue = new BN(user.total_balance)
      const audioValue = AUDIO(balanceValue)
      return formatCount(Number(audioValue.toFixed(2)))
    }
  })

  return (
    <HoverCard
      content={
        <>
          <HoverCardHeader
            icon={audioTierBadgeMap[tier]}
            title={getBadgeName(tier)}
            onClose={onClose}
            iconRight={IconArrowRight}
          />
          <HoverCardBody
            icon={<IconLogoCircle size='3xl' />}
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
