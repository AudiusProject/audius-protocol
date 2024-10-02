import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import {
  StreamTrackAvailabilityType,
  AccessConditions
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { pluralize } from '@audius/common/utils'
import { IconCart } from '@audius/harmony'

import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useMessages } from 'hooks/useMessages'

import { UsdcPurchaseFields } from './UsdcPurchaseFields'

const messagesV1 = {
  usdcPurchase: 'Premium (Pay-to-Unlock)',
  usdcPurchaseSubtitle: (contentType: 'album' | 'track') =>
    `Unlockable by purchase, these ${pluralize(
      contentType,
      2
    )} are visible to everyone but only playable by users who have paid for access.`
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

  const { isEnabled: isEditableAccessEnabled } = useFeatureFlag(
    FeatureFlags.EDITABLE_ACCESS_ENABLED
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

  return (
    <ModalRadioItem
      icon={<IconCart />}
      label={messages.usdcPurchase}
      description={messages.usdcPurchaseSubtitle(isAlbum ? 'album' : 'track')}
      value={StreamTrackAvailabilityType.USDC_PURCHASE}
      disabled={disableUsdcGate}
      checkedContent={
        <UsdcPurchaseFields
          disabled={disableUsdcGate}
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
