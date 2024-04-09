import {
  useAccessAndRemixSettings,
  useHasNoCollectibles
} from '@audius/common/hooks'
import {
  StreamTrackAvailabilityType,
  AccessConditions
} from '@audius/common/models'
import { IconCollectible } from '@audius/harmony'

import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'

import { CollectibleGatedDescription } from './CollectibleGatedDescription'
import { CollectibleGatedFields } from './CollectibleGatedFields'

const messages = {
  collectibleGated: 'Collectible Gated',
  noCollectibles:
    'No Collectibles found. To enable this option, link a wallet containing a collectible.'
}

type CollectibleGatedRadioFieldProps = {
  isRemix: boolean
  isUpload?: boolean
  initialStreamConditions?: AccessConditions
  isInitiallyUnlisted?: boolean
}

export const CollectibleGatedRadioField = (
  props: CollectibleGatedRadioFieldProps
) => {
  const { isRemix, isUpload, initialStreamConditions, isInitiallyUnlisted } =
    props

  const hasNoCollectibles = useHasNoCollectibles()
  const {
    disableCollectibleGate: disabled,
    disableCollectibleGateFields: fieldsDisabled
  } = useAccessAndRemixSettings({
    isUpload: !!isUpload,
    isRemix,
    initialStreamConditions: initialStreamConditions ?? null,
    isInitiallyUnlisted: !!isInitiallyUnlisted
  })

  return (
    <ModalRadioItem
      icon={<IconCollectible />}
      label={messages.collectibleGated}
      value={StreamTrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={disabled}
      hintContent={disabled ? messages.noCollectibles : undefined}
      description={
        <CollectibleGatedDescription
          hasCollectibles={!hasNoCollectibles}
          isUpload={true}
        />
      }
      checkedContent={<CollectibleGatedFields disabled={fieldsDisabled} />}
    />
  )
}
