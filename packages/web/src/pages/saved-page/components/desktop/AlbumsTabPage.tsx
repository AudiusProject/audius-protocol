import { useMemo } from 'react'

import {
  Status,
  statusIsNotFinalized,
  useFetchedSavedCollections,
  useAccountAlbums
} from '@audius/common'

import { InfiniteCardLineup } from 'components/lineup/InfiniteCardLineup'
import EmptyTable from 'components/tracks-table/EmptyTable'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { useOrderedLoad } from 'hooks/useOrderedLoad'

import { CollectionCard } from './CollectionCard'
import styles from './SavedPage.module.css'

const messages = {
  emptyAlbumsHeader: 'You haven’t favorited any albums yet.',
  emptyAlbumsBody: 'Once you have, this is where you’ll find them!',
  goToTrending: 'Go to Trending'
}

export const AlbumsTabPage = () => {
  const goToRoute = useGoToRoute()

  const { data: savedAlbums, status: accountAlbumsStatus } = useAccountAlbums()
  const savedAlbumIds = useMemo(
    () => savedAlbums.map((a) => a.id),
    [savedAlbums]
  )

  const {
    data: fetchedAlbumIds,
    status,
    hasMore,
    fetchMore
  } = useFetchedSavedCollections({
    collectionIds: savedAlbumIds,
    type: 'albums',
    pageSize: 20
  })
  const { isLoading: isAlbumLoading, setDidLoad } = useOrderedLoad(
    fetchedAlbumIds.length
  )
  const cards = fetchedAlbumIds.map((id, i) => {
    return (
      <CollectionCard
        index={i}
        isLoading={isAlbumLoading(i)}
        setDidLoad={setDidLoad}
        key={id}
        albumId={id}
      />
    )
  })

  const noSavedAlbums =
    accountAlbumsStatus === Status.SUCCESS && savedAlbumIds.length === 0
  const noFetchedResults = !statusIsNotFinalized(status) && cards.length === 0

  if (noSavedAlbums || noFetchedResults) {
    return (
      <EmptyTable
        primaryText={messages.emptyAlbumsHeader}
        secondaryText={messages.emptyAlbumsBody}
        buttonLabel={messages.goToTrending}
        onClick={() => goToRoute('/trending')}
      />
    )
  }

  return (
    <InfiniteCardLineup
      hasMore={hasMore}
      loadMore={fetchMore}
      cards={cards}
      cardsClassName={styles.cardsContainer}
    />
  )
}
