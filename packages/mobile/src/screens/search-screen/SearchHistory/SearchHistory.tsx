import { searchSelectors } from '@audius/common/store'
import { FlatList, Keyboard } from 'react-native'
import { useSelector } from 'react-redux'

import { Divider } from 'app/components/core'

import { ClearSearchHistoryListItem } from './ClearSearchHistoryListItem'
import { SearchHistoryListItem } from './SearchHistoryListItem'

const { getSearchHistory } = searchSelectors

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
