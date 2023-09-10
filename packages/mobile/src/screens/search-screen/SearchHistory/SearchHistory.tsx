import { FlatList, Keyboard } from 'react-native'
import { useSelector } from 'react-redux'

import { Divider } from 'app/components/core'
import { getSearchHistory } from 'app/store/search/selectors'

import { ClearSearchHistoryListItem } from './ClearSearchHistoryListItem'
import { SearchHistoryListItem } from './SearchHistoryListItem'

export const SearchHistory = () => {
  const history = useSelector(getSearchHistory)

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
