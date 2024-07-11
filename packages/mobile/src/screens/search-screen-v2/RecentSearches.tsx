import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'

import { recentSearchMessages as messages } from '@audius/common/messages'
import { searchActions, searchSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Flex, IconCloseAlt, Text } from '@audius/harmony-native'
import { FlatList } from 'app/components/core'

import { SearchItem } from './SearchItem'

const { getV2SearchHistory } = searchSelectors
const { removeItem, clearHistory } = searchActions

const MAX_RECENT_SEARCHES = 12

type RecentSearchesProps = {
  ListHeaderComponent?: ReactNode
}

export const RecentSearches = (props: RecentSearchesProps) => {
  const { ListHeaderComponent } = props
  const history = useSelector(getV2SearchHistory)
  const dispatch = useDispatch()

  const handleClearSearchHistory = useCallback(() => {
    dispatch(clearHistory())
  }, [dispatch])

  const truncatedSearchItems = useMemo(
    () => history.slice(0, MAX_RECENT_SEARCHES),
    [history]
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
          <Button
            variant='secondary'
            size='small'
            style={{ alignSelf: 'center' }}
            onPress={handleClearSearchHistory}
          >
            {messages.clear}
          </Button>
        </Flex>
      }
    />
  )
}
