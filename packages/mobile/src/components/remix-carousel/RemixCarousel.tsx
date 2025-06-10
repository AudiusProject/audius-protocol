import { useTracks } from '@audius/common/api'
import { type ID, type Track } from '@audius/common/models'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { RemixContestCard } from './RemixContestCard'

type ListProps = Omit<CardListProps<Track>, 'data'>

export type UserListProps = {
  trackIds: ID[] | undefined
  onCardPress?: (user_id: ID) => void
} & Partial<ListProps>

export const RemixCarousel = (props: UserListProps) => {
  const { trackIds, ...other } = props
  const { data: tracks } = useTracks(trackIds)
  return (
    <CardList
      data={tracks}
      renderItem={({ item }) => {
        return <RemixContestCard track={item} />
      }}
      {...other}
    />
  )
}
