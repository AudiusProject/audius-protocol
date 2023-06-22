import {
  Collection,
  collectionPageSelectors,
  CommonState
} from '@audius/common'
import { useSelector } from 'react-redux'

import { EditButton } from './EditButton'
import { OverflowMenuButton } from './OverflowMenuButton'
import { PublishButton } from './PublishButton'
import { ShareButton } from './ShareButton'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'
const { getCollection } = collectionPageSelectors

type OwnerActionButtonProps = {
  collectionId: number
}

export const OwnerActionButtons = (props: OwnerActionButtonProps) => {
  const { collectionId } = props
  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection
  const { track_count, is_private, is_album } = collection

  return (
    <>
      <EditButton
        collectionId={collectionId}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <ShareButton
        collectionId={collectionId}
        disabled={track_count === 0}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      {is_private && !is_album ? (
        <PublishButton
          collectionId={collectionId}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
        />
      ) : null}

      {!is_private ? (
        <OverflowMenuButton collectionId={collectionId} isOwner />
      ) : null}
    </>
  )
}
