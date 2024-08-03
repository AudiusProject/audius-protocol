import { Collection } from '@audius/common/models'
import { collectionPageSelectors, CommonState } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { EditButton } from './EditButton'
import { OverflowMenuButton } from './OverflowMenuButton'
import { PublishButton } from './PublishButton'
import { ShareButton } from './ShareButton'
const { getCollection } = collectionPageSelectors

type OwnerActionButtonProps = {
  collectionId: number
}

export const OwnerActionButtons = (props: OwnerActionButtonProps) => {
  const { collectionId } = props
  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection
  const { is_private, is_album, playlist_contents, ddex_app } = collection ?? {}
  const track_count = playlist_contents.track_ids.length

  const isDisabled = !track_count || track_count === 0

  if (!collection) return null

  return (
    <>
      {ddex_app ? null : <EditButton collectionId={collectionId} />}
      <ShareButton
        collectionId={collectionId}
        disabled={isDisabled}
        tooltipText={
          isDisabled
            ? `You can’t share an empty ${is_album ? 'album' : 'playlist'}.`
            : undefined
        }
      />
      {is_private ? <PublishButton collectionId={collectionId} /> : null}

      <OverflowMenuButton collectionId={collectionId} isOwner />
    </>
  )
}
