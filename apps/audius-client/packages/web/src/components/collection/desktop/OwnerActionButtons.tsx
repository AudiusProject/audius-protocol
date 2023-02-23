import {
  Collection,
  collectionPageSelectors,
  CommonState
} from '@audius/common'
import { useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import Toast from 'components/toast/Toast'
import { ComponentPlacement } from 'components/types'

import { EditButton } from './EditButton'
import { OverflowMenuButton } from './OverflowMenuButton'
import { PublishButton } from './PublishButton'
import { ShareButton } from './ShareButton'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'
const { getCollection } = collectionPageSelectors

const messages = {
  playlistViewable: 'Your playlist can now be viewed by others!'
}

type OwnerActionButtonProps = {
  collectionId: number
}

export const OwnerActionButtons = (props: OwnerActionButtonProps) => {
  const { collectionId } = props
  const { track_count, is_private, is_album, _is_publishing } = useSelector(
    (state: CommonState) => getCollection(state, { id: collectionId })
  ) as Collection

  const wasPublishing = usePrevious(_is_publishing)

  if (track_count === 0) {
    return (
      <EditButton
        collectionId={collectionId}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
    )
  }

  return (
    <>
      {is_private && !is_album ? (
        <PublishButton collectionId={collectionId} />
      ) : (
        <Toast
          text={messages.playlistViewable}
          delay={3000}
          fillParent={false}
          placement={ComponentPlacement.TOP}
          open={wasPublishing && !_is_publishing && !is_private}
        >
          <ShareButton collectionId={collectionId} />
        </Toast>
      )}

      <EditButton
        collectionId={collectionId}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      {!is_private ? (
        <OverflowMenuButton collectionId={collectionId} isOwner />
      ) : null}
    </>
  )
}
