import { useCallback } from 'react'

import { recentSearchMessages as messages } from '@audius/common/messages'
import { searchActions, searchSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Flex, IconClose, Text } from '@audius/harmony-native'
import { FlatList } from 'app/components/core'

import { SearchItem } from './SearchItem'

const { getV2SearchHistory } = searchSelectors
const { removeItem, clearHistory } = searchActions

export const RecentSearches = () => {
  const history = useSelector(getV2SearchHistory)
  const dispatch = useDispatch()

  const handleClearSearchHistory = useCallback(() => {
    dispatch(clearHistory())
  }, [dispatch])

  if (history.length === 0) return null

  return (
    <Flex p='l'>
      <FlatList
        ListHeaderComponent={<Text variant='title'>{messages.title}</Text>}
        data={history}
        keyExtractor={({ id, kind }) => `${kind}-${id}`}
        renderItem={({ item }) => (
          <SearchItem
            searchItem={item}
            icon={IconClose}
            onPressIcon={() => dispatch(removeItem({ searchItem: item }))}
          />
        )}
        ListFooterComponent={
          <Flex pt='l'>
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
    </Flex>
  )
}
