import { FlatList, Keyboard } from 'react-native'
import { useSelector } from 'react-redux'

import { Divider } from 'app/components/core'
import { getSearchHistory } from 'app/store/search/selectors'

import { ClearSearchHistoryListItem } from './ClearSearchHistoryListItem'
import { SearchHistoryListItem } from './SearchHistoryListItem'
import { EmptySearch } from './content/EmptySearch'

export const SearchHistory = () => {
  const history = useSelector(getSearchHistory)

  if (history.length === 0) {
    return <EmptySearch />
  }

  return (
    <FlatList
      onTouchStart={Keyboard.dismiss}
      keyboardShouldPersistTaps='always'
      data={history}
      keyExtractor={(item) => item}
      renderItem={({ item }) => <SearchHistoryListItem text={item} />}
      ItemSeparatorComponent={Divider}
      ListFooterComponent={ClearSearchHistoryListItem}
    />
  )
}
