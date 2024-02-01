import { useCallback } from 'react'

import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import {
  Name,
  StreamTrackAvailabilityType,
  AccessConditions
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { IconCart, IconStars } from '@audius/stems'

import { ExternalLink } from 'components/link'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { make, track } from 'services/analytics'

import { UsdcPurchaseFields } from './UsdcPurchaseFields'
import styles from './UsdcPurchaseGatedRadioField.module.css'

const WAITLIST_TYPEFORM = 'https://link.audius.co/waitlist'

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
  initialStreamConditions?: AccessConditions
  isInitiallyUnlisted?: boolean
}

export const UsdcPurchaseGatedRadioField = (
  props: UsdcPurchaseGatedRadioFieldProps
) => {
  const { isRemix, isUpload, initialStreamConditions, isInitiallyUnlisted } =
    props

  const handleClickWaitListLink = useCallback(() => {
    track(make({ eventName: Name.TRACK_UPLOAD_CLICK_USDC_WAITLIST_LINK }))
  }, [])

  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )

  const { noUsdcGate } = useAccessAndRemixSettings({
    isUpload: !!isUpload,
    isRemix,
    initialStreamConditions: initialStreamConditions ?? null,
    isInitiallyUnlisted: !!isInitiallyUnlisted
  })
  const disabled = noUsdcGate || !isUsdcUploadEnabled

  const helpContent = (
    <div className={styles.helpContent}>
      <div>{messages.waitlist}</div>
      <ExternalLink
        onClick={handleClickWaitListLink}
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
      value={StreamTrackAvailabilityType.USDC_PURCHASE}
      disabled={disabled}
      hintIcon={<IconStars />}
      hintContent={!isUsdcUploadEnabled ? helpContent : undefined}
      tag={!isUsdcUploadEnabled ? messages.comingSoon : undefined}
      checkedContent={<UsdcPurchaseFields disabled={disabled} />}
    />
  )
}
