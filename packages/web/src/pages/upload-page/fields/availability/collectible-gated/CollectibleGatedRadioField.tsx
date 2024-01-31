import { useAccessAndRemixSettings } from '@audius/common/hooks'
import { TrackAvailabilityType, AccessConditions } from '@audius/common/models'
import { collectiblesSelectors } from '@audius/common/store'
import { IconCollectible } from '@audius/stems'

import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useSelector } from 'utils/reducer'

import { CollectibleGatedDescription } from './CollectibleGatedDescription'
import { CollectibleGatedFields } from './CollectibleGatedFields'

const { getSupportedUserCollections } = collectiblesSelectors

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

  const hasCollectibles = useSelector((state) => {
    const { ethCollectionMap, solCollectionMap } =
      getSupportedUserCollections(state)

    const numEthCollectibles = Object.keys(ethCollectionMap).length
    const numSolCollectibles = Object.keys(solCollectionMap).length
    return numEthCollectibles + numSolCollectibles > 0
  })

  const {
    noCollectibleGate: disabled,
    noCollectibleGateFields: fieldsDisabled
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
      value={TrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={disabled}
      hintContent={disabled ? messages.noCollectibles : undefined}
      description={
        <CollectibleGatedDescription
          hasCollectibles={hasCollectibles}
          isUpload={true}
        />
      }
      checkedContent={<CollectibleGatedFields disabled={fieldsDisabled} />}
    />
  )
}
