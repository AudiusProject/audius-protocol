import { ReactNode } from 'react'

import { BadgeTier, AudioTiers } from '@audius/common/src/models/BadgeTier'
import {
  IconTokenBronze,
  IconTokenSilver,
  IconTokenGold,
  IconTokenPlatinum,
  HoverCardHeader,
  HoverCard,
  IconLogoCircle
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
   * The amount to display in the body
   */
  amount: string

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
  amount,
  onClose,
  anchorOrigin,
  transformOrigin,
  onClick
}: AudioHoverCardProps) => {
  return (
    <HoverCard
      content={
        <>
          <HoverCardHeader
            icon={audioTierBadgeMap[tier]}
            title={getBadgeName(tier)}
            onClose={onClose}
          />
          <HoverCardBody icon={<IconLogoCircle size='3xl' />} amount={amount} />
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
