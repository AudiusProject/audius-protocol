import React, { useCallback, useEffect, useState } from 'react'
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
import { usePushSearchRoute } from './utils'
import { getTagSearchRoute } from '../../utils/routes'

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: 14,
    paddingRight: 14,
    height: 40,
    borderBottomWidth: 1
  },
  itemTextContainer: {
    flex: 1
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
    marginBottom: 32
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
  const itemContainerStyles = useTheme(styles.itemContainer, {
    borderBottomColor: 'neutralLight8'
  })
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWebAction()
  const pushRoute = usePushSearchRoute()

  const onPress = useCallback(() => {
    dispatch(submitQuery(text))
    if (text.startsWith('#')) {
      pushRoute(getTagSearchRoute(text.substring(1)), 'search')
    } else {
      dispatchWeb({
        type: MessageType.SUBMIT_SEARCH_QUERY,
        query: text,
        isAction: true
      })
    }
  }, [dispatch, text, pushRoute, dispatchWeb])

  return (
    <TouchableHighlight
      underlayColor={backgroundColor}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={itemContainerStyles}>
        <View style={styles.itemTextContainer}>
          <Text numberOfLines={1} style={itemTextStyles}>
            {text}
          </Text>
        </View>
        <IconArrow style={styles.arrow} fill={color} />
      </View>
    </TouchableHighlight>
  )
}

const SearchHistory = () => {
  const { searchHistory, clearHistory, hasFetched } = useSearchHistory()
  const [displayHistory, setDisplayHistory] = useState(searchHistory.current)

  // Only update history on component load and clearing of search history
  useEffect(() => {
    if (hasFetched) setDisplayHistory(searchHistory.current)
  }, [hasFetched, setDisplayHistory, searchHistory])

  const onClearHistory = useCallback(() => {
    setDisplayHistory([])
    clearHistory()
  }, [clearHistory, setDisplayHistory])

  const backgroundColor = useColor('neutralLight8')
  const containerStyles = useTheme(styles.container, {
    borderTopColor: 'neutralLight8'
  })
  const clearTextStyle = useTheme(styles.clearText, { color: 'neutralLight4' })

  if (!displayHistory || displayHistory.length === 0) {
    return <EmptySearch />
  }

  return (
    <View style={containerStyles} onTouchStart={Keyboard.dismiss}>
      <FlatList
        keyboardShouldPersistTaps={'always'}
        data={displayHistory.concat('clear')}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        renderItem={({ item }) =>
          item !== 'clear' ? (
            <SearchHistoryItem key={item} text={item} />
          ) : (
            <TouchableHighlight
              key={'clear'}
              onPress={onClearHistory}
              style={styles.clearTouchable}
              underlayColor={backgroundColor}
              activeOpacity={0.8}
            >
              <View style={styles.clearContainer}>
                <Text style={clearTextStyle}>{messages.clear}</Text>
              </View>
            </TouchableHighlight>
          )
        }
      />
    </View>
  )
}
export default SearchHistory
