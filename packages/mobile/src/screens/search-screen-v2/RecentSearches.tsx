import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'

import { recentSearchMessages as messages } from '@audius/common/messages'
import type { SearchItem as SearchItemType } from '@audius/common/store'
import { searchActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { Flex, IconCloseAlt, PlainButton, Text } from '@audius/harmony-native'
import { FlatList } from 'app/components/core'

import { SearchItem } from './SearchItem'

const { removeItem, clearHistory } = searchActions

const MAX_RECENT_SEARCHES = 12

type RecentSearchesProps = {
  ListHeaderComponent?: ReactNode
  searchItems?: SearchItemType[]
}

export const RecentSearches = (props: RecentSearchesProps) => {
  const { ListHeaderComponent, searchItems = [] } = props
  const dispatch = useDispatch()

  const handleClearSearchHistory = useCallback(() => {
    dispatch(clearHistory())
  }, [dispatch])

  const truncatedSearchItems = useMemo(
    () => searchItems.slice(0, MAX_RECENT_SEARCHES),
    [searchItems]
  )

  if (truncatedSearchItems.length === 0) return null

  return (
    <FlatList
      ListHeaderComponent={
        <Flex gap='l'>
          {ListHeaderComponent}
          <Flex ph='l'>
            <Text variant='title'>{messages.title}</Text>
          </Flex>
        </Flex>
      }
      data={truncatedSearchItems}
      keyExtractor={({ id, kind }) => `${kind}-${id}`}
      renderItem={({ item }) => (
        <SearchItem
          searchItem={item}
          icon={IconCloseAlt}
          onPressIcon={() => dispatch(removeItem({ searchItem: item }))}
        />
      )}
      ListFooterComponent={
        <Flex pv='l' ph='l'>
          <PlainButton
            style={{ alignSelf: 'center' }}
            onPress={handleClearSearchHistory}
          >
            {messages.clear}
          </PlainButton>
        </Flex>
      }
    />
  )
}
