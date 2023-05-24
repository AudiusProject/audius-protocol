import { useCallback } from 'react'

import type { Collection, ID, UserCollection } from '@audius/common'
import { CreatePlaylistSource } from '@audius/common'
import type { ListRenderItem } from 'react-native'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { AddCollectionCard } from './AddCollectionCard'
import { CollectionCard } from './CollectionCard'
import { CollectionCardSkeleton } from './CollectionCardSkeleton'

type ListProps = Omit<CardListProps<UserCollection>, 'data' | 'renderItem'>
type CreateCard = { _create: boolean }

type CollectionListProps = {
  collection: Collection[] | undefined
  /** Optional mapping of collection ids to the number that should be shown as the # of tracks in the collection's info card. Added this because im offline mode, the number of tracks downloaded may not yet match the actual number of tracks in the collection. */
  collectionIdsToNumTracks?: Record<number, number>
  renderItem?: ListRenderItem<Collection | CreateCard> | null
  // Props to show and setup tile for creating new playlists
  showCreatePlaylistTile?: boolean
  createPlaylistSource?: CreatePlaylistSource | null
  createPlaylistTrackId?: ID | null
  createPlaylistCallback?: () => void
} & ListProps

export const CollectionList = (props: CollectionListProps) => {
  const {
    collection,
    collectionIdsToNumTracks,
    showCreatePlaylistTile = false,
    createPlaylistSource = CreatePlaylistSource.FAVORITES_PAGE,
    createPlaylistTrackId,
    createPlaylistCallback,
    renderItem,
    ...other
  } = props

  const renderCard = useCallback(
    ({ item }: { item: Collection | CreateCard }) =>
      '_create' in item ? (
        <AddCollectionCard
          source={createPlaylistSource!}
          sourceTrackId={createPlaylistTrackId}
          onCreate={createPlaylistCallback}
        />
      ) : (
        <CollectionCard
          collection={item}
          numTracks={collectionIdsToNumTracks?.[item.playlist_id] ?? undefined}
        />
      ),
    [
      collectionIdsToNumTracks,
      createPlaylistCallback,
      createPlaylistSource,
      createPlaylistTrackId
    ]
  )

  const updatedCollection = showCreatePlaylistTile
    ? [{ _create: true }, ...(collection ?? [])]
    : collection

  return (
    <CardList
      data={updatedCollection}
      renderItem={renderItem ?? renderCard}
      LoadingCardComponent={CollectionCardSkeleton}
      {...other}
    />
  )
}
