import { collectionPageSelectors, CommonState } from '@audius/common'
import { Collection, ID } from '@audius/common/models'
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

  const { track_count, is_private } = collection ?? {}
  const isDisabled = !collection || track_count === 0 || is_private

  return (
    <>
      <ShareButton
        disabled={isDisabled}
        collectionId={collectionId}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <RepostButton
        disabled={isDisabled}
        collectionId={collectionId}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      <FavoriteButton
        disabled={isDisabled}
        collectionId={collectionId}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
      />
      <OverflowMenuButton collectionId={collectionId} />
    </>
  )
}
