import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import LottieView from 'lottie-react-native'

import IconCaretRight from '../../assets/images/iconCaretRight.svg'
import IconRemove from '../../assets/images/iconRemove.svg'
import { useColor, useSpecialColor, useTheme } from '../../utils/theme'
import { useDispatchWebAction } from '../../hooks/useWebAction'
import { MessageType } from '../../message'

import { getSearchQuery, getSearchResultQuery } from '../../store/search/selectors'
import { updateQuery } from '../../store/search/actions'
import useSearchHistory from '../../store/search/hooks'


const IS_IOS = Platform.OS === 'ios'

const styles = StyleSheet.create({
  topBar: {
    height: IS_IOS ? 85 : 55,
    borderBottomWidth: 1
  },
  container: {
    position: 'absolute',
    bottom: 5,
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    paddingLeft: 12,
    paddingRight: 16,
  },
  caret: {
    transform: [{ rotate: '180deg' }]
  },
  removeIcon: {
    position: 'absolute',
    right: 20,
    bottom: 3
  },
  loadingIcon: {
    position: 'absolute',
    right: 20,
    bottom: 3,
    width: 24,
    height: 24
  },
  input: {
    position: 'relative',
    marginLeft: 12,
    flex: 1,
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 26,
    fontFamily: 'AvenirNextLTPro-Medium'
  },
  temp: {
    color: 'red'
  }
})

type TopBarProps = {
  isOpen: boolean
  onClose: () => void
}

const TopBar = ({
  onClose,
  isOpen
}: TopBarProps) => {
  const color = useColor('neutralLight4')
  const topBarStyle = useTheme(styles.topBar, {
    backgroundColor: color,
    borderBottomColor: 'neutralLight9'
  })

  const inputStyles = useTheme(styles.input, {
    backgroundColor: 'neutralLight10',
    borderColor: 'neutralLight8',
    color: 'neutral'
  })

  const textRef = useRef<TextInput>(null)
  useEffect(() => {
    if (isOpen) textRef.current?.focus()
    else textRef.current?.blur()
  }, [textRef, isOpen])

  const dispatchWeb = useDispatchWebAction()
  const { appendSearchItem } = useSearchHistory()
  const query = useSelector(getSearchQuery)
  const dispatch = useDispatch()
  const setQuery = useCallback((text: string) => {
    dispatch(updateQuery(text))
  }, [dispatch])

  const onSubmit = useCallback(({ nativeEvent: { text } }) => {
    appendSearchItem(text)
    dispatchWeb({
      type: MessageType.UPDATE_SEARCH_QUERY,
      query: text
    })
  }, [dispatchWeb, appendSearchItem])


  const onChangeText = useCallback((text: string) => {
    setQuery(text)
    dispatchWeb({
      type: MessageType.UPDATE_SEARCH_QUERY,
      query: text,
      isAction: true
    })
  }, [dispatchWeb, setQuery])

  const clearSearch = useCallback(() => {
    setQuery('')
    textRef.current?.focus()
  }, [textRef, setQuery])

  const searchResultQuery = useSelector(getSearchResultQuery)
  const hasText = query !== ''
  const isLoading = hasText && searchResultQuery !== query
  const spinnerColor = useColor('neutralLight4')

  return (
    <View style={topBarStyle}>
      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
          <IconCaretRight width={24} height={24} fill={color} style={styles.caret} />
        </TouchableOpacity>
        <TextInput
          ref={textRef}
          value={query}
          onChangeText={onChangeText}
          style={inputStyles}
          autoCompleteType={'off'}
          autoCorrect={false}
          returnKeyType={'search'}
          onSubmitEditing={onSubmit}
        />
        {isLoading && (
          <View style={styles.loadingIcon}>
            <LottieView
              source={require('../../assets/animations/loadingSpinner.json')}
              autoPlay
              loop
              colorFilters={[
                {
                  keypath: 'Shape Layer 1',
                  color: spinnerColor
                },
                {
                  keypath: 'Shape Layer 2',
                  color: spinnerColor
                }
              ]}
            />
          </View>
        )}
        {hasText && !isLoading && (
          <TouchableOpacity activeOpacity={0.7} onPress={clearSearch} style={styles.removeIcon}>
            <IconRemove width={24} height={24} fill={color} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default TopBar

