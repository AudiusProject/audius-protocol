import { useMemo } from 'react'

import { type ID } from '@audius/common/models'

import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { RemixContestCard } from './RemixContestCard'

export type RemixContestCardProps = {
  trackIds: ID[] | undefined
  inView?: boolean
  onCardPress?: (trackId: ID) => void
} & Partial<ListProps>

type IDCardListItem = {
  trackId: ID
  _create: boolean
}
type ListProps = Omit<CardListProps<IDCardListItem>, 'data'>

export const RemixCarousel = (props: RemixContestCardProps) => {
  const { trackIds, inView, ...other } = props

  const idList = useMemo(() => {
    if (!trackIds) return undefined
    const trackIDData = trackIds.map((trackId) => ({
      _create: true,
      trackId
    }))
    return trackIDData
  }, [trackIds])

  return (
    <CardList
      data={idList}
      isLoading={!inView}
      renderItem={({ item }) => {
        return <RemixContestCard trackId={item.trackId} />
      }}
      horizontal
      {...other}
    />
  )
}
