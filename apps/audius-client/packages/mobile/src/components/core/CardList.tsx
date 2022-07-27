import { useCallback, useRef } from 'react'

import type {
  FlatList as RNFlatList,
  FlatListProps,
  ListRenderItem
} from 'react-native'
import { View } from 'react-native'

import { useScrollToTop } from 'app/hooks/useScrollToTop'

import { EmptyTile } from './EmptyTile'
import { FlatList } from './FlatList'

export type CardListProps<ItemT> = FlatListProps<ItemT> & {
  emptyListText?: string
  disableTopTabScroll?: boolean
}

export const CardList = <ItemT,>(props: CardListProps<ItemT>) => {
  const { renderItem, emptyListText, disableTopTabScroll, data, ...other } =
    props

  const ref = useRef<RNFlatList>(null)
  useScrollToTop(() => {
    ref.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  }, disableTopTabScroll)

  const handleRenderItem: ListRenderItem<ItemT> = useCallback(
    (info) => {
      const { index } = info
      const isInLeftColumn = !(index % 2)
      const isLastRow = index + 2 > (data?.length ?? 0)
      const style = {
        paddingTop: 12,
        paddingBottom: isLastRow ? 12 : 0,
        paddingHorizontal: 6,
        [`padding${isInLeftColumn ? 'Left' : 'Right'}`]: 12,
        width: '50%'
      }
      return <View style={style}>{renderItem?.(info)}</View>
    },
    [renderItem, data]
  )

  return (
    <FlatList
      ref={ref}
      data={data}
      renderItem={handleRenderItem}
      numColumns={2}
      ListEmptyComponent={
        emptyListText ? <EmptyTile message={emptyListText} /> : undefined
      }
      {...other}
    />
  )
}
