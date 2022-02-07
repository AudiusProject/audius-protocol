import { ReactElement, useCallback } from 'react'

import {
  FlatList,
  FlatListProps,
  ListRenderItemInfo,
  ViewStyle,
  StyleProp,
  ListRenderItem,
  Text
} from 'react-native'

import { EmptyCard } from './EmptyCard'

type ListProps<ItemT> = Omit<FlatListProps<ItemT>, 'renderItem'>

type CardListRenderItemInfo<ItemT> = ListRenderItemInfo<ItemT> & {
  style: StyleProp<ViewStyle>
}

export type CardListProps<ItemT> = ListProps<ItemT> & {
  renderItem: (info: CardListRenderItemInfo<ItemT>) => ReactElement | null
  emptyListText?: string
}

export const CardList = <ItemT,>(props: CardListProps<ItemT>) => {
  const { renderItem, emptyListText, ...other } = props

  const handleRenderItem: ListRenderItem<ItemT> = useCallback(
    info => {
      const { index } = info
      const isInLeftColumn = !(index % 2)
      const style = {
        padding: 8,
        [`padding${isInLeftColumn ? 'Left' : 'Right'}`]: 16,
        width: '50%'
      }
      return renderItem({ ...info, style })
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
