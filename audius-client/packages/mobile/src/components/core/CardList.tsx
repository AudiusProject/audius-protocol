import { useCallback } from 'react'

import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  Text,
  View
} from 'react-native'

import { EmptyCard } from './EmptyCard'

export type CardListProps<ItemT> = FlatListProps<ItemT> & {
  emptyListText?: string
}

export const CardList = <ItemT,>(props: CardListProps<ItemT>) => {
  const { renderItem, emptyListText, ...other } = props

  const handleRenderItem: ListRenderItem<ItemT> = useCallback(
    info => {
      const { index } = info
      const isInLeftColumn = !(index % 2)
      const style = {
        paddingVertical: 12,
        paddingBottom: 0,
        [`padding${isInLeftColumn ? 'Left' : 'Right'}`]: 12,
        width: '50%'
      }
      return <View style={style}>{renderItem?.(info)}</View>
    },
    [renderItem]
  )

  return (
    <FlatList
      renderItem={handleRenderItem}
      numColumns={2}
      ListEmptyComponent={
        emptyListText ? (
          <EmptyCard>
            <Text>{emptyListText}</Text>
          </EmptyCard>
        ) : undefined
      }
      {...other}
    />
  )
}
