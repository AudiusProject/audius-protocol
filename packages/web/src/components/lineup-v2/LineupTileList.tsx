import { Kind } from '@audius/common/models'
import { makeIndexedUid } from '@audius/common/utils'
import { Flex } from '@audius/harmony'

import { TrackTileV2 } from 'components/track/desktop/TrackTileV2'

import { useLineupContext } from './LineupContext'

export const LineupTileList = () => {
  const { items, name } = useLineupContext()

  return (
    <Flex gap='s' direction='column'>
      {items.map((item, index) => {
        const uid = makeIndexedUid(item.kind, item.id, index, name)

        if (item.kind === Kind.TRACKS) {
          return <TrackTileV2 uid={uid} key={uid} lineupIndex={index} />
        }

        if (item.kind === Kind.COLLECTIONS) {
          return <div key={index}>Collection {item.id}</div>
        }

        return null
      })}
    </Flex>
  )
}
