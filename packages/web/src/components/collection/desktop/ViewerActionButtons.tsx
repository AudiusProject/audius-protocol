import { useCollection } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { pick } from 'lodash'

import { FavoriteButton } from './FavoriteButton'
import { OverflowMenuButton } from './OverflowMenuButton'
import { RepostButton } from './RepostButton'
import { ShareButton } from './ShareButton'

type ViewerActionButtonsProps = {
  collectionId: ID
}

export const ViewerActionButtons = (props: ViewerActionButtonsProps) => {
  const { collectionId } = props
  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) =>
      pick(collection, 'track_count', 'is_private', 'access')
  })
  const { track_count, is_private: isPrivate, access } = partialCollection ?? {}

  const isDisabled = !partialCollection || track_count === 0 || isPrivate
  const hasStreamAccess = access?.stream

  return isPrivate ? null : (
    <>
      {hasStreamAccess ? (
        <>
          <RepostButton disabled={isDisabled} collectionId={collectionId} />
          <FavoriteButton disabled={isDisabled} collectionId={collectionId} />
        </>
      ) : null}
      <ShareButton disabled={isDisabled} collectionId={collectionId} />
      <OverflowMenuButton collectionId={collectionId} />
    </>
  )
}
