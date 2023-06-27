import { useCallback, useMemo } from 'react'

import {
  useFetchedSavedCollections,
  useAccountPlaylists,
  cacheCollectionsActions,
  CreatePlaylistSource,
  Status,
  statusIsNotFinalized
} from '@audius/common'
import { IconPlus } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { InfiniteCardLineup } from 'components/lineup/InfiniteCardLineup'
import EmptyTable from 'components/tracks-table/EmptyTable'
import UploadChip from 'components/upload/UploadChip'
import { useOrderedLoad } from 'hooks/useOrderedLoad'

import { CollectionCard } from './CollectionCard'
import styles from './SavedPage.module.css'
const { createPlaylist } = cacheCollectionsActions

const messages = {
  emptyPlaylistsHeader: 'You haven’t created or favorited any playlists yet.',
  emptyPlaylistsBody: 'Once you have, this is where you’ll find them!',
  createPlaylist: 'Create Playlist',
  newPlaylist: 'New Playlist'
}

export const PlaylistsTabPage = () => {
  const dispatch = useDispatch()

  const { data: savedAlbums, status: accountPlaylistsStatus } =
    useAccountPlaylists()
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
  const { isLoading, setDidLoad } = useOrderedLoad(fetchedAlbumIds.length)
  const cards = fetchedAlbumIds.map((id, i) => {
    return (
      <CollectionCard
        index={i}
        isLoading={isLoading(i)}
        setDidLoad={setDidLoad}
        key={id}
        albumId={id}
      />
    )
  })

  const handleCreatePlaylist = useCallback(() => {
    dispatch(
      createPlaylist(
        { playlist_name: messages.newPlaylist },
        CreatePlaylistSource.FAVORITES_PAGE
      )
    )
  }, [dispatch])

  const noSavedPlaylists =
    accountPlaylistsStatus === Status.SUCCESS && savedAlbumIds.length === 0
  const noFetchedResults = !statusIsNotFinalized(status) && cards.length === 0

  if (noSavedPlaylists || noFetchedResults) {
    return (
      <EmptyTable
        primaryText={messages.emptyPlaylistsHeader}
        secondaryText={messages.emptyPlaylistsBody}
        buttonLabel={messages.createPlaylist}
        buttonIcon={<IconPlus />}
        onClick={handleCreatePlaylist}
      />
    )
  }

  const createPlaylistCard = (
    <UploadChip type='playlist' variant='card' onClick={handleCreatePlaylist} />
  )

  cards.unshift(createPlaylistCard)

  return (
    <InfiniteCardLineup
      hasMore={hasMore}
      loadMore={fetchMore}
      cards={cards}
      cardsClassName={styles.cardsContainer}
    />
  )
}
