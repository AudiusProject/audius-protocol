import { useCallback } from 'react'

import { Kind } from '@audius/common/models'
import { makeIndexedUid } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import {
  AutoSizer,
  InfiniteLoader,
  List,
  WindowScroller
} from 'react-virtualized'

import { TrackTileV2 } from 'components/track/desktop/TrackTileV2'

import { useLineupContext } from './LineupContext'

export const LineupTileList = () => {
  const { items, name, hasMore, loadMore } = useLineupContext()

  const renderRow = useCallback(
    ({ index }: { index: number }) => {
      const row = items[index]
      if (!row) return

      const uid = makeIndexedUid(row.kind, row.id, index, name)

      if (row.kind === Kind.TRACKS) {
        return (
          <li key={uid}>
            <TrackTileV2 uid={uid} key={uid} lineupIndex={index} />
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
    <Flex gap='s' direction='column'>
      <InfiniteLoader
        isRowLoaded={({ index }) => !!items[index]}
        loadMoreRows={hasMore ? (loadMore as any) : () => {}}
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
  )
}
