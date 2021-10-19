import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { StyleSheet, Animated, View } from 'react-native'

import {
  getIsOpen,
  getSearchQuery,
  getSearchResultQuery,
  getSearchResults
} from '../../store/search/selectors'
import * as searchActions from '../../store/search/actions'
import { useTheme } from '../../utils/theme'
import useAppState from '../../hooks/useAppState'
import useLocation from '../../hooks/useLocation'
import { usePushRouteWeb } from '../../hooks/usePushRouteWeb'
import TopBar from './TopBar'
import SearchHistory from './SearchHistory'
import SearchResults from './SearchResults'
import Header from '../header/Header'
import EmptySearch from './content/EmptySearch'
import { getEmptyPageRoute } from '../../utils/routes'

const FADE_DURATION = 80

const styles = StyleSheet.create({
  animator: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    elevation: 1,
    zIndex: 2
  },
  container: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 3
  }
})

const Search = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector(getIsOpen)
  const close = useCallback(() => dispatch(searchActions.close()), [dispatch])

  const [anchorRoute, setAnchorRoute] = useState<string | null>(null)
  const [viewDisplay, setViewDisplay] = useState<'none' | 'flex'>('none')
  const [didOpen, setDidOpen] = useState<boolean>(false)

  const { pathname } = useLocation() || {}

  const pushWebRouteNoClose = usePushRouteWeb()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const fadeIn = useCallback(() => {
    setViewDisplay('flex')
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: FADE_DURATION,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setDidOpen(true)
        pushWebRouteNoClose(getEmptyPageRoute(), 'search')
      }
    })
  }, [fadeAnim, setViewDisplay, setDidOpen, pushWebRouteNoClose])

  const fadeOut = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      delay: 80,
      duration: FADE_DURATION,
      useNativeDriver: true
    }).start(() => {
      setDidOpen(false)
      setViewDisplay('none')
    })
  }, [fadeAnim, setViewDisplay, setDidOpen])

  // On App enter foreground/background
  useAppState(
    () => {},
    () => {
      if (isOpen) {
        fadeIn()
        if (!anchorRoute) setAnchorRoute(pathname)
      } else {
        fadeOut()
      }
    }
  )

  useEffect(() => {
    if (isOpen) {
      fadeIn()
      if (!anchorRoute) setAnchorRoute(pathname)
    } else {
      fadeOut()
    }
  }, [isOpen, fadeIn, fadeOut, fadeAnim, pathname, anchorRoute, setAnchorRoute])

  const pushWebRoute = usePushRouteWeb(close)
  const onClose = useCallback(() => {
    if (anchorRoute) {
      pushWebRoute(anchorRoute, 'search')
      setAnchorRoute(null)
    } else {
      close()
    }
  }, [setAnchorRoute, anchorRoute, pushWebRoute, close])

  const containerStyle = useTheme(styles.container, {
    backgroundColor: 'white'
  })

  const searchQuery = useSelector(getSearchQuery)
  const searchResultQuery = useSelector(getSearchResultQuery)
  const searchResults = useSelector(getSearchResults)
  const hasResults = Object.values(searchResults).some(
    result => result && result.length > 0
  )
  let body = null
  if (!!searchQuery && hasResults) {
    body = <SearchResults />
  } else if (!!searchQuery && !!searchResultQuery && !hasResults) {
    body = <EmptySearch query={searchResultQuery} />
  } else {
    body = <SearchHistory />
  }

  if (!isOpen && !didOpen) {
    return null
  }

  return (
    <>
      {/* Fade in */}
      <Animated.View
        style={[
          styles.animator,
          {
            opacity: fadeAnim,
            display: viewDisplay
          }
        ]}
      >
        <View style={containerStyle}>
          <TopBar onClose={onClose} isOpen={didOpen} />
          <Header text={'Search'} containerStyle={{ width: 90 }} />
          {body}
        </View>
      </Animated.View>
    </>
  )
}

export default Search
