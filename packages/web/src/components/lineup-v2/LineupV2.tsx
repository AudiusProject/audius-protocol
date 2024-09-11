import { createContext, useCallback, useContext } from 'react'

import { ID, Kind, UID } from '@audius/common/models'
import {
  PlayerBehavior,
  playerSelectors,
  queueActions,
  QueueSource
} from '@audius/common/store'
import { makeUid, Uid } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch, useSelector } from 'react-redux'

import { TrackTileV2 } from 'components/track/desktop/TrackTileV2'

const { getUid: getCurrentPlayerTrackUid } = playerSelectors

type LineupItem = {
  kind: Kind.TRACKS | Kind.COLLECTIONS
  id: ID
}

type LineupV2Props = {
  items: LineupItem[]
  name: string
  queueSource: QueueSource
}
type LineupContextType = {
  onPlay: (uid: UID) => void
}

export const LineupContext = createContext<LineupContextType>({
  onPlay: (_) => {}
})

export const useLineupContext = () => {
  return useContext(LineupContext)
}

export const LineupV2 = (props: LineupV2Props) => {
  const { items, name, queueSource } = props
  const dispatch = useDispatch()
  const currentPlayerTrackUid = useSelector(getCurrentPlayerTrackUid)

  const onPlay = useCallback(
    (uid: UID) => {
      const id = Number(Uid.getComponent(uid, 'id'))

      if (!currentPlayerTrackUid || uid !== currentPlayerTrackUid) {
        // Why is the first song played twice?
        const toQueue = items.map((item) => {
          return {
            uid: makeUid(item.kind, item.id, name),
            id: item.id,
            source: queueSource,
            playerBehavior: PlayerBehavior.PREVIEW_OR_FULL
          }
        })

        dispatch(queueActions.clear({}))
        dispatch(queueActions.add({ entries: toQueue }))
      }

      dispatch(
        queueActions.play({
          uid,
          trackId: id,
          source: name,
          playerBehavior: PlayerBehavior.PREVIEW_OR_FULL
        })
      )
    },
    [name, queueSource, items, currentPlayerTrackUid, dispatch]
  )

  const { hasMore, loadMore } = useLineupContext()

  return (
    <LineupContext.Provider value={{ onPlay }}>
      <Flex gap='s' direction='column'>
        <InfiniteScroll
          loadMore={hasMore ? loadMore : () => {}}
          hasMore={hasMore}
          initialLoad={false}
          threshold={0.3}
          element='ol'
        >
          {items.map((item, index) => {
            const uid = makeUid(item.kind, item.id, name, index)

            if (item.kind === Kind.TRACKS) {
              return (
                <li key={uid}>
                  <TrackTileV2 uid={uid} key={uid} />
                </li>
              )
            }

            if (item.kind === Kind.COLLECTIONS) {
              return (
                <li key={uid}>
                  <div key={index}>Collection {item.id}</div>
                </li>
              )
            }

            return null
          })}
        </InfiniteScroll>
      </Flex>
    </LineupContext.Provider>
  )
}
