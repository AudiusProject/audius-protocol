import type { ReactNode } from 'react'
import { useEffect, useRef, useCallback } from 'react'

import type { Theme } from '@audius/common/models'
import { Pressable, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { usePrevious } from 'react-use'
import type { RiveRef } from 'rive-react-native'
import Rive from 'rive-react-native'

import { makeStyles } from 'app/styles'
import { useThemeColors, useThemeVariant } from 'app/utils/theme'

import { BOTTOM_BAR_BUTTON_HEIGHT } from '../constants'

export type BottomTabBarButtonProps = BaseBottomTabBarButtonProps & {
  name: string
  children?: ReactNode
}

export type BottomTabBarRiveButtonProps = BottomTabBarButtonProps & {
  themeVariant: Theme
}

export type BaseBottomTabBarButtonProps = {
  isActive: boolean
  onPress: (isActive: boolean, routeName: string, routeKey: string) => void
  onLongPress: () => void
  routeKey: string
}

const useStyles = makeStyles(() => ({
  root: {
    width: '20%'
  },
  button: {
    alignItems: 'center'
  },
  iconWrapper: {
    width: 28,
    height: BOTTOM_BAR_BUTTON_HEIGHT
  },
  underlay: {
    width: '100%',
    height: BOTTOM_BAR_BUTTON_HEIGHT,
    position: 'absolute'
  }
}))

const BottomTabBarRiveButton = (props: BottomTabBarRiveButtonProps) => {
  const {
    name,
    routeKey,
    isActive,
    onPress,
    onLongPress,
    children,
    themeVariant
  } = props
  const styles = useStyles()
  const { neutralLight8, neutralLight10 } = useThemeColors()
  const riveRef = useRef<RiveRef | null>(null)
  const previousActive = usePrevious(isActive)
  const initialIsActive = Boolean(
    (isActive && previousActive === undefined) || (previousActive && isActive)
  )

  const handlePress = useCallback(() => {
    if (!isActive) {
      riveRef.current?.play()
    }
    onPress(isActive, name, routeKey)
  }, [onPress, routeKey, isActive, name])

  useEffect(() => {
    if (previousActive && !isActive) {
      riveRef.current?.reset()
    }
  }, [isActive, previousActive])

  const handleLongPress = isActive ? onLongPress : handlePress

  return (
    <View style={styles.root}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        pointerEvents='box-only'
        style={styles.button}
      >
        {({ pressed }) => {
          return (
            <>
              {pressed ? (
                <LinearGradient
                  style={styles.underlay}
                  colors={[neutralLight8, neutralLight10]}
                />
              ) : null}
              <Rive
                ref={riveRef}
                style={styles.iconWrapper}
                resourceName={`${name}_${themeVariant}`}
                autoplay={initialIsActive}
              />
              {children}
            </>
          )
        }}
      </Pressable>
    </View>
  )
}

/**
 * To ensure proper initialization and rive-ref management, we need to wrap the
 * rive buttons with a theme-aware container that swaps out rive button
 * instances when the theme chancges.
 */
export const BottomTabBarButton = (props: BottomTabBarButtonProps) => {
  const themeVariant = useThemeVariant()
  return (
    <BottomTabBarRiveButton
      key={themeVariant}
      themeVariant={themeVariant}
      {...props}
    />
  )
}
