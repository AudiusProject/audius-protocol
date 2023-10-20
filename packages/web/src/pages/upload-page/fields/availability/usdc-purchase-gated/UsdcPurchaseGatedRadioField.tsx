import {
  FeatureFlags,
  PremiumConditions,
  TrackAvailabilityType,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated
} from '@audius/common'
import { IconCart, IconStars } from '@audius/stems'

import { ExternalLink } from 'components/link'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useFlag } from 'hooks/useRemoteConfig'

import { UsdcPurchaseFields } from './UsdcPurchaseFields'
import styles from './UsdcPurchaseGatedRadioField.module.css'

const WAITLIST_TYPEFORM = 'https://example.com'

const messages = {
  usdcPurchase: 'Premium (Pay-to-Unlock)',
  usdcPurchaseSubtitle:
    'Unlockable by purchase, these tracks are visible to everyone but only playable by users who have paid for access.',
  waitlist:
    'Start selling your music on Audius today! Limited access beta now available.',
  join: 'Join the Waitlist',
  comingSoon: 'Coming Soon'
}

type UsdcPurchaseGatedRadioFieldProps = {
  isRemix: boolean
  isUpload?: boolean
  initialPremiumConditions?: PremiumConditions
  isInitiallyUnlisted?: boolean
}

export const UsdcPurchaseGatedRadioField = (
  props: UsdcPurchaseGatedRadioFieldProps
) => {
  const { isRemix, isUpload, initialPremiumConditions, isInitiallyUnlisted } =
    props

  const { isEnabled: isUsdcUploadEnabled } = useFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )

  const isInitiallyPublic =
    !isUpload && !isInitiallyUnlisted && !initialPremiumConditions
  const isInitiallySpecialAccess =
    !isUpload &&
    !!(
      isPremiumContentFollowGated(initialPremiumConditions) ||
      isPremiumContentTipGated(initialPremiumConditions)
    )
  const isInitiallyCollectibleGated =
    !isUpload && isPremiumContentCollectibleGated(initialPremiumConditions)

  const disabled =
    isInitiallyPublic ||
    isInitiallySpecialAccess ||
    isInitiallyCollectibleGated ||
    isRemix ||
    !isUsdcUploadEnabled

  const helpContent = (
    <div className={styles.helpContent}>
      <div>{messages.waitlist}</div>
      <ExternalLink
        className={styles.link}
        to={WAITLIST_TYPEFORM}
        target='_blank'
        ignoreWarning
      >
        {messages.join}
      </ExternalLink>
    </div>
  )

  return (
    <ModalRadioItem
      icon={<IconCart />}
      label={messages.usdcPurchase}
      description={messages.usdcPurchaseSubtitle}
      value={TrackAvailabilityType.USDC_PURCHASE}
      disabled={disabled}
      hintIcon={<IconStars />}
      hintContent={disabled ? helpContent : undefined}
      tag={disabled ? messages.comingSoon : undefined}
      checkedContent={<UsdcPurchaseFields disabled={disabled} />}
    />
  )
}
