import React, { useState, useCallback } from 'react'

import { StyleSheet, Animated, Text, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import * as searchActions from 'app/store/search/actions'
import { getSearchResultQuery } from 'app/store/search/selectors'
import { getSearchRoute } from 'app/utils/routes'
import { useColor, useTheme } from 'app/utils/theme'

const messages = {
  more: 'See More Results'
}

const styles = StyleSheet.create({
  moreContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
    marginLeft: 8,
    marginRight: 8,
    marginTop: 32,
    marginBottom: 64,
    borderRadius: 4
  },
  moreText: {
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Bold',
    marginRight: 8
  }
})

const MoreContainer = () => {
  const color = useColor('staticWhite')
  const moreContainerStyles = useTheme(styles.moreContainer, {
    backgroundColor: 'primary'
  })
  const moreTextStyles = useTheme(styles.moreText, { color: 'staticWhite' })
  const dispatch = useDispatch()
  const onClose = useCallback(() => dispatch(searchActions.close()), [dispatch])
  const pushWebRoute = usePushRouteWeb(onClose)

  const searchResultQuery = useSelector(getSearchResultQuery)
  const onClickMore = useCallback(() => {
    pushWebRoute(getSearchRoute(searchResultQuery), 'search')
  }, [pushWebRoute, searchResultQuery])

  const [shrinkAnim] = useState(new Animated.Value(1))
  const onPressIn = useCallback(() => {
    Animated.timing(shrinkAnim, {
      toValue: 0,
      duration: 70,
      useNativeDriver: true
    }).start()
  }, [shrinkAnim])

  const onPressOut = useCallback(() => {
    Animated.timing(shrinkAnim, {
      toValue: 1,
      duration: 70,
      useNativeDriver: true
    }).start()
  }, [shrinkAnim])

  return (
    <TouchableOpacity
      onPress={onClickMore}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          moreContainerStyles,
          {
            transform: [
              {
                scaleX: shrinkAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1]
                })
              },
              {
                scaleY: shrinkAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1]
                })
              }
            ]
          }
        ]}
      >
        <Text style={moreTextStyles}>{messages.more}</Text>
        <IconArrow height={24} width={24} fill={color} />
      </Animated.View>
    </TouchableOpacity>
  )
}

export default MoreContainer
