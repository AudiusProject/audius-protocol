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
  const {
    is_private,
    is_album,
    playlist_contents,
    ddex_app,
    _is_publishing,
    stream_conditions,
    is_stream_gated,
    tracks
  } = collection ?? {}
  const track_count = playlist_contents.track_ids.length

  const isDisabled = !track_count || track_count === 0

  return collection ? (
    <>
      {!ddex_app && <EditButton collectionId={collectionId} />}
      <ShareButton
        collectionId={collectionId}
        disabled={isDisabled}
        tooltipText={
          isDisabled
            ? `You can’t share an empty ${is_album ? 'album' : 'playlist'}.`
            : undefined
        }
      />
      {is_private ? (
        <PublishButton
          collectionId={collectionId}
          _is_publishing={_is_publishing}
          track_count={track_count}
          stream_conditions={stream_conditions}
          is_private={is_private}
          is_stream_gated={is_stream_gated}
          tracks={tracks}
        />
      ) : null}

      {!is_private ? (
        <OverflowMenuButton collectionId={collectionId} isOwner />
      ) : null}
    </>
  ) : null
}
