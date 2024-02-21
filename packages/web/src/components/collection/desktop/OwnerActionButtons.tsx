import { Collection } from '@audius/common/models'
import { collectionPageSelectors, CommonState } from '@audius/common/store'
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
  const { is_private, is_album, playlist_contents } = collection ?? {}
  const track_count = playlist_contents.track_ids.length

  const isDisabled = !track_count || track_count === 0

  return collection ? (
    <>
      <EditButton
        collectionId={collectionId}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <ShareButton
        collectionId={collectionId}
        disabled={isDisabled}
        tooltipText={
          isDisabled
            ? `You can’t share an empty ${is_album ? 'album' : 'playlist'}.`
            : undefined
        }
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      {is_private ? (
        <PublishButton
          collectionId={collectionId}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
        />
      ) : null}

      {!is_private ? (
        <OverflowMenuButton collectionId={collectionId} isOwner />
      ) : null}
    </>
  ) : null
}
