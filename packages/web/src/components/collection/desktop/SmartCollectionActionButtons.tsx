import { SmartCollectionVariant, ID } from '@audius/common/models'

import { FavoriteButton } from './FavoriteButton'
import { ShareButton } from './ShareButton'

type SmartCollectionActionButtonsProps = {
  collectionId: SmartCollectionVariant
  userId: ID | null
}

export const SmartCollectionActionButtons = (
  props: SmartCollectionActionButtonsProps
) => {
  const { collectionId, userId } = props

  return collectionId === SmartCollectionVariant.AUDIO_NFT_PLAYLIST ? (
    <ShareButton collectionId={collectionId} userId={userId} />
  ) : (
    <FavoriteButton />
  )
}
