import { UserCollection } from 'audius-client/src/common/models/Collection'

import { CardList, CardListProps } from 'app/components/core'
import { CollectionCard } from 'app/screens/explore-screen/components/CollectionCard'

type ListProps = Omit<
  CardListProps<UserCollection>,
  'data' | 'renderItem' | 'ListEmptyComponent'
>

type CollectionListProps = {
  collection: UserCollection[]
  emptyTabText?: string
} & ListProps

export const CollectionList = (props: CollectionListProps) => {
  const { collection, ...other } = props
  return (
    <CardList
      data={collection}
      renderItem={({ item }) => <CollectionCard collection={item} />}
      {...other}
    />
  )
}
