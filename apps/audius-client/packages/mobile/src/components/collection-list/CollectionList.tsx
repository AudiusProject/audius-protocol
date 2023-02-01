import type { Collection, UserCollection } from '@audius/common'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { CollectionCard } from './CollectionCard'
import { CollectionCardSkeleton } from './CollectionCardSkeleton'

type ListProps = Omit<CardListProps<UserCollection>, 'data' | 'renderItem'>

type CollectionListProps = {
  collection: Collection[] | undefined
} & ListProps

const renderCard = ({ item }: { item: Collection }) => (
  <CollectionCard collection={item} />
)

export const CollectionList = (props: CollectionListProps) => {
  const { collection, ...other } = props

  return (
    <CardList
      data={collection}
      renderItem={renderCard}
      LoadingCardComponent={CollectionCardSkeleton}
      {...other}
    />
  )
}
