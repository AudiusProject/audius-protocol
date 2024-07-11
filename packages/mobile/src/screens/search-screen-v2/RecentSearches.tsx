import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'

import type { SearchCategory } from '@audius/common/api'
import { recentSearchMessages as messages } from '@audius/common/messages'
import { Kind } from '@audius/common/models'
import { searchActions, searchSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Flex, IconClose, Text } from '@audius/harmony-native'
import { FlatList } from 'app/components/core'

import { SearchItem } from './SearchItem'
import { useSearchCategory } from './searchState'

const { getV2SearchHistory } = searchSelectors
const { removeItem, clearHistory } = searchActions

const MAX_RECENT_SEARCHES = 12

type RecentSearchesProps = {
  ListHeaderComponent?: ReactNode
}

const itemKindByCategory: Record<SearchCategory, Kind | null> = {
  all: null,
  users: Kind.USERS,
  tracks: Kind.TRACKS,
  playlists: Kind.COLLECTIONS,
  albums: Kind.COLLECTIONS
}

export const RecentSearches = (props: RecentSearchesProps) => {
  const { ListHeaderComponent } = props
  const [category] = useSearchCategory()
  const history = useSelector(getV2SearchHistory)
  const dispatch = useDispatch()

  const handleClearSearchHistory = useCallback(() => {
    dispatch(clearHistory())
  }, [dispatch])

  const categoryKind: Kind | null = category
    ? itemKindByCategory[category]
    : null

  const filteredSearchItems = useMemo(() => {
    return categoryKind
      ? history.filter((item) => item.kind === categoryKind)
      : history
  }, [categoryKind, history])

  const truncatedSearchItems = useMemo(
    () => filteredSearchItems.slice(0, MAX_RECENT_SEARCHES),
    [filteredSearchItems]
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
          icon={IconClose}
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
