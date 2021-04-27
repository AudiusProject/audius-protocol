import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableHighlight,
  Keyboard
} from 'react-native'
import useSearchHistory from '../../store/search/hooks'
import { submitQuery } from '../../store/search/actions'
import { useColor, useTheme } from '../../utils/theme'
import { useDispatchWebAction } from '../../hooks/useWebAction'
import { MessageType } from '../../message'
import EmptySearch from './content/EmptySearch'
import IconArrow from '../../assets/images/iconArrow.svg'

const messages = {
  clear: 'Clear Recent Searches',
  empty: 'Search for Artists, Tracks, Playlists, & Albums'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderTopWidth: 1
  },
  itemContainer: {
    display: 'flex',
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: 14,
    paddingRight: 14,
    height: 40,
    borderBottomWidth: 1
  },
  itemText: {
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Regular'
  },
  arrow: {
    height: 12,
    width: 12
  },
  clearTouchable: {
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 24,
    marginRight: 24,
  },
  clearContainer: {
    padding: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  clearText: {
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Bold'
  }
})

type SearchHistoryItemProps = {
  text: string
}
const SearchHistoryItem = ({ text }: SearchHistoryItemProps) => {
  const backgroundColor = useColor('neutralLight8')
  const color = useColor('neutralLight4')
  const itemTextStyles = useTheme(styles.itemText, { color: 'neutral' })
  const itemContainerStyles = useTheme(styles.itemContainer, { borderBottomColor: 'neutralLight8' })
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWebAction()

  const onPress = useCallback(() => {
    dispatch(submitQuery(text))
    dispatchWeb({
      type: MessageType.SUBMIT_SEARCH_QUERY,
      query: text,
      isAction: true
    })
  }, [dispatch, text])

  return (
    <TouchableHighlight
      underlayColor={backgroundColor}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={itemContainerStyles}>
        <Text style={itemTextStyles}>{text}</Text>
        <IconArrow style={styles.arrow} fill={color} />
      </View>
    </TouchableHighlight>
  )
}

const SearchHistory = () => {
  const {
    searchHistory,
    clearHistory
  } = useSearchHistory()

  const backgroundColor = useColor('neutralLight8')
  const containerStyles = useTheme(styles.container, { borderTopColor: 'neutralLight8' })
  const clearTextStyle = useTheme(styles.clearText, { color: 'neutralLight4' })

  if (!searchHistory || searchHistory.length === 0) {
    return (
      <EmptySearch />
    )
  }

  return (
    <View style={containerStyles} onTouchStart={Keyboard.dismiss}>
      <FlatList
        keyboardShouldPersistTaps={'always'}
        data={searchHistory.concat('clear')}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        renderItem={({ item }) => item !== 'clear' ? (
          <SearchHistoryItem key={item} text={item} />
        ) : (
          <TouchableHighlight
            key={'clear'}
            onPress={clearHistory}
            style={styles.clearTouchable}
            underlayColor={backgroundColor}
            activeOpacity={0.8}
          >
            <View style={styles.clearContainer}>
              <Text style={clearTextStyle}>{messages.clear}</Text>
            </View>
          </TouchableHighlight>
        )}
      />
    </View>
  )
}
export default SearchHistory
