import { useCallback } from 'react'

import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import {
  Name,
  StreamTrackAvailabilityType,
  AccessConditions
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { pluralize } from '@audius/common/utils'
import { Hint, IconCart, IconStars } from '@audius/harmony'

import { ExternalTextLink } from 'components/link'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useMessages } from 'hooks/useMessages'
import { make, track } from 'services/analytics'

import { UsdcPurchaseFields } from './UsdcPurchaseFields'

const WAITLIST_TYPEFORM = 'https://link.audius.co/waitlist'
const PREMIUM_ALBUMS_BLOG =
  'https://blog.audius.co/article/premium-albums-now-available'

const messagesV1 = {
  usdcPurchase: 'Premium (Pay-to-Unlock)',
  usdcPurchaseSubtitle: (contentType: 'album' | 'track') =>
    `Unlockable by purchase, these ${pluralize(
      contentType,
      2
    )} are visible to everyone but only playable by users who have paid for access.`,
  waitlist:
    'Start selling your music on Audius today! Limited access beta now available.',
  join: 'Join the Waitlist',
  learnMore: 'Learn More',
  comingSoon: 'Coming Soon'
}

const messagesV2 = {
  usdcPurchase: 'Premium',
  usdcPurchaseSubtitle: (contentType: 'album' | 'track') =>
    `Only fans who make a purchase can play your ${contentType}.`,
  fromFreeHint: (contentType: 'album' | 'track') =>
    `You can't make a free ${contentType} premium.`
}

type UsdcPurchaseGatedRadioFieldProps = {
  isRemix: boolean
  isUpload?: boolean
  isAlbum?: boolean
  initialStreamConditions?: AccessConditions
  isInitiallyUnlisted?: boolean
  isPublishDisabled?: boolean
}

export const UsdcPurchaseGatedRadioField = (
  props: UsdcPurchaseGatedRadioFieldProps
) => {
  const {
    isRemix,
    isUpload,
    isAlbum,
    initialStreamConditions,
    isInitiallyUnlisted,
    isPublishDisabled
  } = props

  const messages = useMessages(
    messagesV1,
    messagesV2,
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )

  const handleClickWaitListLink = useCallback(() => {
    track(make({ eventName: Name.TRACK_UPLOAD_CLICK_USDC_WAITLIST_LINK }))
  }, [])

  const { isEnabled: isEditableAccessEnabled } = useFeatureFlag(
    FeatureFlags.EDITABLE_ACCESS_ENABLED
  )
  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )

  const { disableUsdcGate } = useAccessAndRemixSettings({
    isEditableAccessEnabled: !!isEditableAccessEnabled,
    isUpload: !!isUpload,
    isRemix,
    isAlbum,
    initialStreamConditions: initialStreamConditions ?? null,
    isInitiallyUnlisted: !!isInitiallyUnlisted,
    isPublishDisabled
  })
  const disabled = disableUsdcGate || !isUsdcUploadEnabled

  const waitlistHint = (
    <Hint
      icon={IconStars}
      actions={
        <>
          <ExternalTextLink
            variant='visible'
            to={WAITLIST_TYPEFORM}
            onClick={handleClickWaitListLink}
          >
            {messages.join}
          </ExternalTextLink>
          {isAlbum ? (
            <ExternalTextLink variant='visible' to={PREMIUM_ALBUMS_BLOG}>
              {messages.learnMore}
            </ExternalTextLink>
          ) : null}
        </>
      }
    >
      {messages.waitlist}
    </Hint>
  )

  return (
    <ModalRadioItem
      icon={<IconCart />}
      label={messages.usdcPurchase}
      description={messages.usdcPurchaseSubtitle(isAlbum ? 'album' : 'track')}
      value={StreamTrackAvailabilityType.USDC_PURCHASE}
      disabled={disabled}
      hint={!isUsdcUploadEnabled ? waitlistHint : undefined}
      tag={!isUsdcUploadEnabled ? messages.comingSoon : undefined}
      checkedContent={
        <UsdcPurchaseFields
          disabled={disabled}
          isAlbum={isAlbum}
          isUpload={isUpload}
        />
      }
      tooltipText={
        disableUsdcGate
          ? messages.fromFreeHint(isAlbum ? 'album' : 'track')
          : undefined
      }
    />
  )
}
