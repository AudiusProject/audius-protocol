import type { ID } from '@audius/common/models'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { TrackCard } from '../track/TrackCard'
import { TrackCardSkeleton } from '../track/TrackCardSkeleton'

type ListProps = Omit<CardListProps<{ trackId: ID }>, 'data'>

export type TrackCardListProps = {
  trackIds: ID[] | undefined
  onCardPress?: (trackId: ID) => void
} & Partial<ListProps>

export const TrackCardList = (props: TrackCardListProps) => {
  const { trackIds, onCardPress, ...other } = props

  const data = trackIds?.map((trackId) => ({ trackId }))

  return (
    <CardList
      data={data}
      renderItem={({ item }) => (
        <TrackCard
          id={item.trackId}
          onPress={() => onCardPress?.(item.trackId)}
        />
      )}
      LoadingCardComponent={TrackCardSkeleton}
      {...other}
    />
  )
}
