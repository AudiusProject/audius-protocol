import type { ID, User } from '@audius/common/models'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { ProfileCard } from './ProfileCard'
import { ProfileCardSkeleton } from './ProfileCardSkeleton'

type ListProps = Omit<CardListProps<User>, 'data'>

export type ProfileListProps = {
  profiles: User[] | undefined
  onCardPress?: (user_id: ID) => void
} & Partial<ListProps>

export const ProfileList = (props: ProfileListProps) => {
  const { profiles, onCardPress, ...other } = props
  return (
    <CardList
      data={profiles}
      renderItem={({ item }) => (
        <ProfileCard profile={item} onPress={onCardPress} />
      )}
      LoadingCardComponent={ProfileCardSkeleton}
      {...other}
    />
  )
}
