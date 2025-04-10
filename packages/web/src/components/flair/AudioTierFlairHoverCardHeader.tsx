import { BadgeTier, AudioTiers } from '@audius/common/src/models/BadgeTier'
import {
  IconTokenBronze,
  IconTokenSilver,
  IconTokenGold,
  IconTokenPlatinum,
  BaseFlairHoverCardHeader
} from '@audius/harmony'

type AudioTierFlairHoverCardHeaderProps = {
  tier: AudioTiers
  onClose?: () => void
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
 * A specific header component for $AUDIO badge tiers
 */
export const AudioTierFlairHoverCardHeader = ({
  tier,
  onClose
}: AudioTierFlairHoverCardHeaderProps) => {
  return (
    <BaseFlairHoverCardHeader
      icon={audioTierBadgeMap[tier]}
      title={getBadgeName(tier)}
      onClose={onClose}
    />
  )
}
