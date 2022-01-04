import React from 'react'

import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'

import { ThemeColors, useThemedStyles } from 'app/hooks/useThemedStyles'

// How much the tab indicator should horizontally stretch
// while it translates for a nice effect.
const INDICATOR_STRETCH_FACTOR = 0.35

// This granularity is how many points of the sin function are added to the stretch animation
// (min value) 1 will not add any points in between and, therefore, there will be no stretching
// (recommended min value) 2 will be a linear stretch to max width and back
// Values above 2 will start to conform to a sin function curve of stretching
// The higher the number, the more accurate the line stretch will follow the sin function
const INDICATOR_ANIM_GRANULARITY = 10

const getSinAnimationRanges = (len: number) => {
  const inputRange = []
  const outputRange = []

  let i = 0
  while (i < len) {
    inputRange.push(i)
    outputRange.push(Math.sin((i % 1) * Math.PI) * INDICATOR_STRETCH_FACTOR + 1)
    i += 1 / INDICATOR_ANIM_GRANULARITY
  }

  return {
    inputRange,
    outputRange
  }
}

const createTabBarStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    tabBarContainer: {
      flexDirection: 'row',
      paddingBottom: 4,
      position: 'relative'
    },

    tabContainer: {
      backgroundColor: themeColors.white,
      flex: 1,
      height: 48
    },

    tab: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'column',
      height: 48,
      justifyContent: 'space-evenly'
    },

    tabText: {
      color: themeColors.neutral,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase'
    },

    tabIndicator: {
      backgroundColor: themeColors.primary,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      height: 3,
      position: 'absolute',
      top: 48,
      zIndex: 9
    }
  })

export const TopTabBar = ({ state, descriptors, navigation, position }) => {
  const screenWidth = Dimensions.get('screen').width
  const isFocused = tabIndex => state.index === tabIndex
  const styles = useThemedStyles(createTabBarStyles)

  const onPress = (route, tabIndex: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true
    })

    if (!isFocused(tabIndex) && !event.defaultPrevented) {
      // The `merge: true` option makes sure that the params inside the tab screen are preserved
      navigation.navigate({ name: route.name, merge: true })
    }
  }

  const onLongPress = (route, tabIndex: number) => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key
    })
  }

  const tabWidth = 100 / state.routes.length

  const left = position.interpolate({
    inputRange: [0, state.routes.length],
    outputRange: [0, screenWidth]
  })

  const xScale = position.interpolate(
    getSinAnimationRanges(state.routes.length)
  )

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const label = options.tabBarLabel ?? options.title ?? route.name
        const Icon = options.tabBarIcon?.()

        const inputRange = state.routes.map((_, i) => i)
        const opacity = position.interpolate({
          inputRange,
          outputRange: inputRange.map(i => (i === index ? 1 : 0.52)) // opacity range
        })

        return (
          <View key={label} style={styles.tabContainer}>
            <TouchableOpacity
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityRole='button'
              accessibilityState={{ selected: isFocused(index) }}
              onLongPress={() => onLongPress(route, index)}
              onPress={() => onPress(route, index)}
              style={styles.tab}
              testID={options.tabBarTestID}
            >
              {Icon && (
                <Animated.View style={{ opacity }}>
                  <Icon />
                </Animated.View>
              )}
              <Animated.Text style={[styles.tabText, { opacity }]}>
                {label}
              </Animated.Text>
            </TouchableOpacity>
          </View>
        )
      })}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{ translateX: left }, { scaleX: xScale }],
            width: `${tabWidth}%`
          }
        ]}
      />
    </View>
  )
}
