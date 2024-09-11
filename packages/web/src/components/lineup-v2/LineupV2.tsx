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
import { useDispatch, useSelector } from 'react-redux'
import {
  AutoSizer,
  InfiniteLoader,
  List,
  WindowScroller
} from 'react-virtualized'

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

  const renderRow = useCallback(
    ({ index }: { index: number }) => {
      const row = items[index]
      if (!row) return

      const uid = makeUid(row.kind, row.id, name, index)

      if (row.kind === Kind.TRACKS) {
        return (
          <li key={uid}>
            <TrackTileV2 uid={uid} key={uid} />
          </li>
        )
      }

      if (row.kind === Kind.COLLECTIONS) {
        return (
          <li key={uid}>
            <div key={index}>Collection {row.id}</div>
          </li>
        )
      }

      return null
    },
    [items, name]
  )

  return (
    <LineupContext.Provider value={{ onPlay }}>
      <Flex gap='s' direction='column'>
        <InfiniteLoader
          isRowLoaded={({ index }) => !!items[index]}
          loadMoreRows={hasMore ? loadMore : () => {}}
          initialLoad={false}
          threshold={0.3}
          element='ol'
        >
          {({ onRowsRendered, registerChild: registerListChild }) => (
            <WindowScroller>
              {({
                height,
                registerChild,
                isScrolling,
                onChildScroll,
                scrollTop
              }) => {
                return (
                  <div
                    ref={
                      registerChild as (
                        instance: HTMLTableSectionElement | null
                      ) => void
                    }
                  >
                    <AutoSizer disableHeight>
                      {({ width }) => (
                        <List
                          // TODO: dynamically calculate row height
                          rowHeight={152 + 16}
                          height={height}
                          width={width}
                          isScrolling={isScrolling}
                          onScroll={onChildScroll}
                          scrollTop={scrollTop}
                          onRowsRendered={(info) => onRowsRendered(info)}
                          ref={registerListChild}
                          overscanRowsCount={2}
                          rowCount={items.length}
                          rowRenderer={renderRow}
                        />
                      )}
                    </AutoSizer>
                  </div>
                )
              }}
            </WindowScroller>
          )}
        </InfiniteLoader>
      </Flex>
    </LineupContext.Provider>
  )
}
