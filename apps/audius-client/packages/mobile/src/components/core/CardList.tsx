import { useCallback, useRef } from 'react'

import { FlatList, FlatListProps, ListRenderItem, View } from 'react-native'

import { useScrollToTop } from 'app/hooks/useScrollToTop'

import { EmptyTile } from './EmptyTile'

export type CardListProps<ItemT> = FlatListProps<ItemT> & {
  emptyListText?: string
  disableTopTabScroll?: boolean
}

export const CardList = <ItemT,>(props: CardListProps<ItemT>) => {
  const { renderItem, emptyListText, disableTopTabScroll, ...other } = props

  const ref = useRef<FlatList>(null)
  useScrollToTop(() => {
    ref.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  }, disableTopTabScroll)

  const handleRenderItem: ListRenderItem<ItemT> = useCallback(
    info => {
      const { index } = info
      const isInLeftColumn = !(index % 2)
      const style = {
        paddingVertical: 12,
        paddingBottom: 0,
        paddingHorizontal: 6,
        [`padding${isInLeftColumn ? 'Left' : 'Right'}`]: 12,
        width: '50%'
      }
      return <View style={style}>{renderItem?.(info)}</View>
    },
    [renderItem]
  )

  return (
    <FlatList
      ref={ref}
      renderItem={handleRenderItem}
      numColumns={2}
      ListEmptyComponent={
        emptyListText ? <EmptyTile message={emptyListText} /> : undefined
      }
      {...other}
    />
  )
}
