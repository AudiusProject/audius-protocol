import { Collection, ID } from '@audius/common/models'
import { collectionPageSelectors, CommonState } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { ClientOnly } from 'components/client-only/ClientOnly'

import { FavoriteButton } from './FavoriteButton'
import { OverflowMenuButton } from './OverflowMenuButton'
import { RepostButton } from './RepostButton'
import { ShareButton } from './ShareButton'

const { getCollection } = collectionPageSelectors

type ViewerActionButtonsProps = {
  collectionId: ID
}
export const ViewerActionButtons = (props: ViewerActionButtonsProps) => {
  const { collectionId } = props
  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection | null

  const { track_count, is_private, access } = collection ?? {}
  const isDisabled = !collection || track_count === 0 || is_private
  const hasStreamAccess = access?.stream

  return (
    <>
      {hasStreamAccess ? (
        <>
          <RepostButton disabled={isDisabled} collectionId={collectionId} />
          <FavoriteButton disabled={isDisabled} collectionId={collectionId} />
        </>
      ) : null}

      <ShareButton disabled={isDisabled} collectionId={collectionId} />
      <ClientOnly>
        <OverflowMenuButton collectionId={collectionId} />
      </ClientOnly>
    </>
  )
}
