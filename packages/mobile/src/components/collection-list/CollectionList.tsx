import { createElement, useCallback, useMemo } from 'react'

import type { Collection, UserCollection, ID } from '@audius/common/models'
import { CreatePlaylistSource } from '@audius/common/models'
import type { ListRenderItem } from 'react-native'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { AddCollectionCard } from './AddCollectionCard'
import { CollectionCard } from './CollectionCard'
import { CollectionCardSkeleton } from './CollectionCardSkeleton'

type FullListProps = Omit<CardListProps<UserCollection>, 'data' | 'renderItem'>
type IDCardListItem = {
  id: ID
}
type IDListProps = Omit<CardListProps<IDCardListItem>, 'data' | 'renderItem'>
type CreateCard = { _create: boolean }

// Props to show and setup tile for creating new playlists
type CreateCollectionTileProps = {
  showCreatePlaylistTile?: boolean
  createPlaylistSource?: CreatePlaylistSource | null
  createPlaylistTrackId?: ID | null
  createPlaylistCallback?: () => void
}

type FullCollectionListProps = {
  collection?: Collection[]
  /** Optional mapping of collection ids to the number that should be shown as the # of tracks in the collection's info card. Added this because im offline mode, the number of tracks downloaded may not yet match the actual number of tracks in the collection. */
  collectionIdsToNumTracks?: Record<number, number>
  renderItem?: ListRenderItem<Collection | CreateCard> | null
} & FullListProps &
  CreateCollectionTileProps

type CollectionIdListProps = {
  collectionIds: ID[]
} & IDListProps &
  CreateCollectionTileProps

type CollectionListProps = FullCollectionListProps | CollectionIdListProps

const FullCollectionList = (props: FullCollectionListProps) => {
  const {
    collection,
    collectionIdsToNumTracks,
    showCreatePlaylistTile = false,
    createPlaylistSource = CreatePlaylistSource.LIBRARY_PAGE,
    createPlaylistTrackId,
    createPlaylistCallback,
    renderItem,
    ...other
  } = props

  const renderCard: ListRenderItem<Collection | CreateCard> = useCallback(
    ({ item }) =>
      '_create' in item ? (
        <AddCollectionCard
          source={createPlaylistSource!}
          sourceTrackId={createPlaylistTrackId}
          onCreate={createPlaylistCallback}
          // TODO: support album type (we don't have use case currently)
          collectionType='playlist'
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

function isIdListProps(
  props: CollectionListProps
): props is CollectionIdListProps {
  return (props as CollectionIdListProps).collectionIds !== undefined
}

const CollectionIDList = (props: CollectionIdListProps) => {
  const {
    collectionIds,
    showCreatePlaylistTile = false,
    createPlaylistSource = CreatePlaylistSource.LIBRARY_PAGE,
    createPlaylistTrackId,
    createPlaylistCallback,
    ...other
  } = props

  const renderCard: ListRenderItem<IDCardListItem | CreateCard> = useCallback(
    ({ item }) =>
      '_create' in item ? (
        <AddCollectionCard
          source={createPlaylistSource!}
          sourceTrackId={createPlaylistTrackId}
          onCreate={createPlaylistCallback}
          // TODO: support album type (we don't have use case currently)
          collectionType='playlist'
        />
      ) : (
        <CollectionCard collectionId={item.id} />
      ),
    [createPlaylistCallback, createPlaylistSource, createPlaylistTrackId]
  )

  const idList: IDCardListItem[] = useMemo(
    () => collectionIds.map((id) => ({ id })),
    [collectionIds]
  )

  const updatedList = showCreatePlaylistTile
    ? [{ _create: true }, ...idList]
    : idList

  return (
    <CardList
      data={updatedList}
      renderItem={renderCard}
      LoadingCardComponent={CollectionCardSkeleton}
      {...other}
    />
  )
}

// Helper to switch between legacy version and newer version of CollectionList.
// The latter just takes IDs and allows the child components to fetch their data
export const CollectionList = (props: CollectionListProps) => {
  return isIdListProps(props)
    ? createElement(CollectionIDList, props)
    : createElement(FullCollectionList, props)
}
