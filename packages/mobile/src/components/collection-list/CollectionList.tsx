import { useCallback } from 'react'

import type { Collection, UserCollection } from '@audius/common'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { CollectionCard } from './CollectionCard'
import { CollectionCardSkeleton } from './CollectionCardSkeleton'

type ListProps = Omit<CardListProps<UserCollection>, 'data' | 'renderItem'>

type CollectionListProps = {
  collection: Collection[] | undefined
  /** Optional mapping of collection ids to the number that should be shown as the # of tracks in the collection's info card. Added this because im offline mode, the number of tracks downloaded may not yet match the actual number of tracks in the collection. */
  collectionIdsToNumTracks?: Record<number, number>
} & ListProps

export const CollectionList = (props: CollectionListProps) => {
  const { collection, collectionIdsToNumTracks, ...other } = props
  const renderCard = useCallback(
    ({ item }: { item: Collection }) => (
      <CollectionCard
        collection={item}
        numTracks={collectionIdsToNumTracks?.[item.playlist_id] ?? undefined}
      />
    ),
    [collectionIdsToNumTracks]
  )

  return (
    <CardList
      data={collection}
      renderItem={renderCard}
      LoadingCardComponent={CollectionCardSkeleton}
      {...other}
    />
  )
}
