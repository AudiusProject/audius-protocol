import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  AccessConditions
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  Text,
  IconCart,
  IconCollectible,
  IconSparkles,
  Flex
} from '@audius/harmony'

const messages = {
  trackTitle: 'TRACK',
  podcastTitle: 'PODCAST',
  remixTitle: 'REMIX',
  hiddenTrackTooltip: 'Anyone with a link to this page will be able to see it',
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  premiumTrack: 'PREMIUM TRACK'
}

type CardTitleProps = {
  className?: string
  isUnlisted: boolean
  isScheduledRelease: boolean
  isRemix: boolean
  isStreamGated: boolean
  isPodcast: boolean
  streamConditions: Nullable<AccessConditions>
}

export const CardTitle = ({
  className,
  isRemix,
  isStreamGated,
  isPodcast,
  streamConditions
}: CardTitleProps) => {
  let content

  if (isStreamGated) {
    let icon
    let message
    if (isContentCollectibleGated(streamConditions)) {
      icon = <IconCollectible size='s' color='subdued' />
      message = messages.collectibleGated
    } else if (isContentUSDCPurchaseGated(streamConditions)) {
      icon = <IconCart size='s' color='subdued' />
      message = messages.premiumTrack
    } else {
      icon = <IconSparkles size='s' color='subdued' />
      message = messages.specialAccess
    }
    content = (
      <Flex gap='s' alignItems='center' justifyContent='center'>
        {icon}
        <Text variant='label' color='subdued'>
          {message}
        </Text>
      </Flex>
    )
  } else {
    content = (
      <Text variant='label' color='subdued'>
        {isRemix
          ? messages.remixTitle
          : isPodcast
            ? messages.podcastTitle
            : messages.trackTitle}
      </Text>
    )
  }

  return (
    <Text variant='title' strength='weak' className={className}>
      {content}
    </Text>
  )
}
