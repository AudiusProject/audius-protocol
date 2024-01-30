import { SmartCollectionVariant, ID } from '@audius/common/models'
import {} from '@audius/common'

import { FavoriteButton } from './FavoriteButton'
import { ShareButton } from './ShareButton'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'

type SmartCollectionActionButtonsProps = {
  collectionId: SmartCollectionVariant
  userId: ID
}

export const SmartCollectionActionButtons = (
  props: SmartCollectionActionButtonsProps
) => {
  const { collectionId, userId } = props

  return collectionId === SmartCollectionVariant.AUDIO_NFT_PLAYLIST ? (
    <ShareButton
      collectionId={collectionId}
      userId={userId}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
    />
  ) : (
    <FavoriteButton widthToHideText={BUTTON_COLLAPSE_WIDTHS.second} />
  )
}
