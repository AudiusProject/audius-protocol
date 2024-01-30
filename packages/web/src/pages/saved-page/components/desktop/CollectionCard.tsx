import { useCallback } from 'react'

import {
  cacheCollectionsSelectors,
  cacheUsersSelectors,
  CommonState
} from '@audius/common'
import { ID } from '@audius/common/models'
import { useSelector } from 'react-redux'

import Card, { CardProps } from 'components/card/desktop/Card'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { collectionPage } from 'utils/route'

import { formatCardSecondaryText } from '../utils'

const { getCollection } = cacheCollectionsSelectors
const { getUser } = cacheUsersSelectors

type CollectionCardProps = Pick<
  CardProps,
  'index' | 'isLoading' | 'setDidLoad'
> & {
  albumId: ID
}

export const CollectionCard = (props: CollectionCardProps) => {
  const { albumId, index, isLoading, setDidLoad } = props
  const goToRoute = useGoToRoute()
  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: albumId })
  )
  const ownerHandle = useSelector((state: CommonState) => {
    if (collection == null) {
      return ''
    }
    const user = getUser(state, { id: collection.playlist_owner_id })
    return user?.handle ?? ''
  })

  const handleClick = useCallback(() => {
    if (ownerHandle && collection) {
      goToRoute(
        collectionPage(
          ownerHandle,
          collection.playlist_name,
          collection.playlist_id,
          collection.permalink,
          true
        )
      )
    }
  }, [collection, ownerHandle, goToRoute])

  return collection ? (
    <Card
      index={index}
      isLoading={isLoading}
      setDidLoad={setDidLoad}
      key={collection.playlist_id}
      id={collection.playlist_id}
      userId={collection.playlist_owner_id}
      imageSize={collection._cover_art_sizes}
      size='medium'
      playlistName={collection.playlist_name}
      playlistId={collection.playlist_id}
      isPlaylist={!collection.is_album}
      isPublic={!collection.is_private}
      handle={ownerHandle}
      primaryText={collection.playlist_name}
      secondaryText={formatCardSecondaryText(
        collection.save_count,
        collection.playlist_contents.track_ids.length
      )}
      isReposted={collection.has_current_user_reposted}
      isSaved={collection.has_current_user_saved}
      cardCoverImageSizes={collection._cover_art_sizes}
      onClick={handleClick}
    />
  ) : null
}
