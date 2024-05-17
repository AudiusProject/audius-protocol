import { createElement, memo, useCallback, useMemo } from 'react'

import type { Collection, UserCollection, ID } from '@audius/common/models'
import { CreatePlaylistSource } from '@audius/common/models'
import type { ListRenderItem } from 'react-native'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { AddCollectionCard } from './AddCollectionCard'
import { CollectionCard } from './CollectionCard'
import { CollectionCardSkeleton } from './CollectionCardSkeleton'

const MemoizedCollectionCard = memo(CollectionCard)

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
  renderItem?: ListRenderItem<Collection | CreateCard> | null
  onCollectionPress?: (id: ID) => void
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
    showCreatePlaylistTile = false,
    createPlaylistSource = CreatePlaylistSource.LIBRARY_PAGE,
    createPlaylistTrackId,
    createPlaylistCallback,
    renderItem,
    onCollectionPress,
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
          id={item.playlist_id}
          onPress={
            onCollectionPress
              ? () => onCollectionPress(item.playlist_id)
              : undefined
          }
        />
      ),
    [
      createPlaylistCallback,
      createPlaylistSource,
      createPlaylistTrackId,
      onCollectionPress
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
        <MemoizedCollectionCard id={item.id} />
      ),
    [createPlaylistCallback, createPlaylistSource, createPlaylistTrackId]
  )

  const idList: (IDCardListItem | CreateCard)[] = useMemo(() => {
    const collectionIdData = collectionIds.map((id) => ({ id }))
    return showCreatePlaylistTile
      ? [{ _create: true }, ...collectionIdData]
      : collectionIdData
  }, [collectionIds, showCreatePlaylistTile])

  return (
    <CardList
      data={idList}
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
