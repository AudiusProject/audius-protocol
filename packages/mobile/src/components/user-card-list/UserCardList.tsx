import type { ID, User, UserMetadata } from '@audius/common/models'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { UserCard } from './UserCard'
import { UserCardSkeleton } from './UserCardSkeleton'

type ListProps = Omit<CardListProps<User>, 'data'>

export type UserCardListProps = {
  profiles: UserMetadata[] | undefined
  onCardPress?: (user_id: ID) => void
} & Partial<ListProps>

export const UserCardList = (props: UserCardListProps) => {
  const { profiles, onCardPress, ...other } = props
  return (
    <CardList
      data={profiles}
      renderItem={({ item }) => (
        <UserCard
          userId={item.user_id}
          onPress={() => onCardPress?.(item.user_id)}
        />
      )}
      LoadingCardComponent={UserCardSkeleton}
      {...other}
    />
  )
}
