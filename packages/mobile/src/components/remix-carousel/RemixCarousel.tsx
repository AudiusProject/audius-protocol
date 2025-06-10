import { useRemixContest, useTracks } from '@audius/common/api'
import {
  SquareSizes,
  type ID,
  type Track,
  type TrackMetadata
} from '@audius/common/models'
import { formatCount } from '@audius/common/utils'

import {
  Divider,
  Flex,
  IconHeart,
  IconRepost,
  Paper,
  Text
} from '@audius/harmony-native'
import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

import { TrackImage } from '../image/TrackImage'
import { UserLink } from '../user-link'

import { RemixContestCard } from './RemixContestCard'

type ListProps = Omit<CardListProps<Track>, 'data'>

export type UserListProps = {
  trackIds: ID[] | undefined
  onCardPress?: (user_id: ID) => void
} & Partial<ListProps>

export const RemixCarousel = (props: UserListProps) => {
  const { trackIds, onCardPress, ...other } = props
  //   const { data: remixContest, isPending: isRemixContestPending } =
  //     useRemixContest(id)
  const { data: tracks, isPending: isTrackPending } = useTracks(trackIds)
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
