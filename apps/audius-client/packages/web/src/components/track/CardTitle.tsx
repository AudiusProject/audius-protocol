import { FeatureFlags, PremiumConditions } from '@audius/common'
import { IconCollectible, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'

import Tooltip from 'components/tooltip/Tooltip'
import { useFlag } from 'hooks/useRemoteConfig'
import HiddenTrackHeader from 'pages/track-page/components/HiddenTrackHeader'

import styles from './GiantTrackTile.module.css'

const messages = {
  trackTitle: 'TRACK',
  podcastTitle: 'PODCAST',
  remixTitle: 'REMIX',
  hiddenTrackTooltip: 'Anyone with a link to this page will be able to see it',
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS'
}

type CardTitleProps = {
  className: string
  isUnlisted: boolean
  isRemix: boolean
  isPremium: boolean
  isPodcast: boolean
  premiumConditions: PremiumConditions
}

export const CardTitle = ({
  className,
  isUnlisted,
  isRemix,
  isPremium,
  isPodcast,
  premiumConditions
}: CardTitleProps) => {
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )
  const { isEnabled: isNewPodcastControlsEnabled } = useFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )

  if (isGatedContentEnabled && isPremium) {
    return (
      <div
        className={cn(styles.headerContainer, className, styles.premiumContent)}
      >
        {premiumConditions?.nft_collection ? (
          <div className={styles.typeLabel}>
            <IconCollectible />
            {messages.collectibleGated}
          </div>
        ) : (
          <div className={styles.typeLabel}>
            <IconSpecialAccess />
            {messages.specialAccess}
          </div>
        )}
      </div>
    )
  }

  if (!isUnlisted) {
    return (
      <div className={cn(styles.headerContainer, className)}>
        <div className={styles.typeLabel}>
          {isRemix
            ? messages.remixTitle
            : isPodcast && isNewPodcastControlsEnabled
            ? messages.podcastTitle
            : messages.trackTitle}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(styles.headerContainer, className)}>
      <Tooltip
        text={messages.hiddenTrackTooltip}
        mouseEnterDelay={0}
        shouldWrapContent={false}
      >
        <div>
          <HiddenTrackHeader />
        </div>
      </Tooltip>
    </div>
  )
}
