import type { ReactNode } from 'react'
import { useCallback } from 'react'

import { Pressable, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Rive from 'rive-react-native'

import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { BOTTOM_BAR_BUTTON_HEIGHT } from '../constants'

export type BaseBottomTabBarButtonProps = {
  isActive: boolean
  onPress: (isActive: boolean, routeName: string, routeKey: string) => void
  onLongPress: () => void
  routeKey: string
}

export type BottomTabBarRiveButtonProps = BaseBottomTabBarButtonProps & {
  name: string
  children?: ReactNode
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

export const BottomTabBarButton = (props: BottomTabBarRiveButtonProps) => {
  const { name, routeKey, isActive, onPress, onLongPress, children } = props
  const styles = useStyles()
  const { neutralLight8, neutralLight10 } = useThemeColors()

  const handlePress = useCallback(() => {
    onPress(isActive, name, routeKey)
  }, [onPress, routeKey, isActive, name])

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
                style={styles.iconWrapper}
                resourceName={name}
                autoplay={isActive}
              />
              {children}
            </>
          )
        }}
      </Pressable>
    </View>
  )
}
