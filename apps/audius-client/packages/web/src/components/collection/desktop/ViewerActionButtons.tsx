import {
  Collection,
  collectionPageSelectors,
  CommonState,
  ID
} from '@audius/common'
import { ButtonType } from '@audius/stems'
import { useSelector } from 'react-redux'

import { FavoriteButton } from './FavoriteButton'
import { OverflowMenuButton } from './OverflowMenuButton'
import { RepostButton } from './RepostButton'
import { ShareButton } from './ShareButton'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'

const { getCollection } = collectionPageSelectors

type ViewerActionButtonsProps = {
  collectionId: ID
}
export const ViewerActionButtons = (props: ViewerActionButtonsProps) => {
  const { collectionId } = props
  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection | null

  const isEmptyPlaylist = !collection || collection.track_count === 0

  return (
    <>
      <ShareButton
        collectionId={collectionId}
        type={isEmptyPlaylist ? ButtonType.DISABLED : undefined}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <RepostButton
        collectionId={collectionId}
        type={isEmptyPlaylist ? ButtonType.DISABLED : undefined}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      <FavoriteButton
        collectionId={collectionId}
        type={isEmptyPlaylist ? ButtonType.DISABLED : undefined}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
      />
      <OverflowMenuButton collectionId={collectionId} />
    </>
  )
}
