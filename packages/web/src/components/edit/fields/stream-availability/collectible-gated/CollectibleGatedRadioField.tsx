import {
  useAccessAndRemixSettings,
  useHasNoCollectibles
} from '@audius/common/hooks'
import { priceAndAudienceMessages as messages } from '@audius/common/messages'
import { StreamTrackAvailabilityType } from '@audius/common/models'
import { IconCollectible } from '@audius/harmony'

import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'

import { CollectibleGatedDescription } from './CollectibleGatedDescription'
import { CollectibleGatedFields } from './CollectibleGatedFields'

type CollectibleGatedRadioFieldProps = {
  isRemix: boolean
  isUpload?: boolean
  isAlbum?: boolean
  isInitiallyUnlisted?: boolean
}

export const CollectibleGatedRadioField = (
  props: CollectibleGatedRadioFieldProps
) => {
  const { isRemix, isUpload, isAlbum, isInitiallyUnlisted } = props

  const hasNoCollectibles = useHasNoCollectibles()
  const {
    disableCollectibleGate: disabled,
    disableCollectibleGateFields: fieldsDisabled
  } = useAccessAndRemixSettings({
    isUpload: !!isUpload,
    isRemix,
    isInitiallyUnlisted: !!isInitiallyUnlisted
  })

  return (
    <ModalRadioItem
      icon={<IconCollectible />}
      label={messages.collectibleGatedRadio.title}
      value={StreamTrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={disabled}
      description={
        <CollectibleGatedDescription
          hasCollectibles={!hasNoCollectibles}
          isUpload={true}
        />
      }
      checkedContent={<CollectibleGatedFields disabled={fieldsDisabled} />}
      tooltipText={
        hasNoCollectibles
          ? messages.collectibleGatedRadio.noCollectibles
          : disabled
            ? messages.fromFreeHint(isAlbum ? 'album' : 'track', 'premium')
            : undefined
      }
    />
  )
}
