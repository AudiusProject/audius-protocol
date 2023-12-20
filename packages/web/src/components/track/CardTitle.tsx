import {
  FeatureFlags,
  Nullable,
  StreamConditions,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated
} from '@audius/common'
import { IconCart, IconCollectible, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'

import Tooltip from 'components/tooltip/Tooltip'
import typeStyles from 'components/typography/typography.module.css'
import { useFlag } from 'hooks/useRemoteConfig'
import HiddenTrackHeader from 'pages/track-page/components/HiddenTrackHeader'

import styles from './GiantTrackTile.module.css'

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
  className: string
  isUnlisted: boolean
  isRemix: boolean
  isStreamGated: boolean
  isPodcast: boolean
  streamConditions: Nullable<StreamConditions>
}

export const CardTitle = ({
  className,
  isUnlisted,
  isRemix,
  isStreamGated,
  isPodcast,
  streamConditions
}: CardTitleProps) => {
  const { isEnabled: isNewPodcastControlsEnabled } = useFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  let content
  const extraStyles = []

  if (isStreamGated) {
    extraStyles.push(styles.gatedContent)
    let icon
    let message
    if (isContentCollectibleGated(streamConditions)) {
      icon = <IconCollectible />
      message = messages.collectibleGated
    } else if (isContentUSDCPurchaseGated(streamConditions)) {
      icon = <IconCart />
      message = messages.premiumTrack
    } else {
      icon = <IconSpecialAccess />
      message = messages.specialAccess
    }
    content = (
      <div className={cn(styles.typeLabel, styles.gatedContentLabel)}>
        {icon}
        {message}
      </div>
    )
  } else {
    content = isUnlisted ? (
      <Tooltip
        text={messages.hiddenTrackTooltip}
        mouseEnterDelay={0}
        shouldWrapContent={false}
      >
        <div>
          <HiddenTrackHeader />
        </div>
      </Tooltip>
    ) : (
      <div className={styles.typeLabel}>
        {isRemix
          ? messages.remixTitle
          : isPodcast && isNewPodcastControlsEnabled
          ? messages.podcastTitle
          : messages.trackTitle}
      </div>
    )
  }

  return (
    <div
      className={cn(
        typeStyles.titleSmall,
        typeStyles.titleWeak,
        styles.headerContainer,
        className,
        ...extraStyles
      )}
    >
      {content}
    </div>
  )
}
