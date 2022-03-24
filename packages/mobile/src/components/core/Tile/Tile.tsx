import { ComponentProps, ComponentType, ReactNode, useCallback } from 'react'

import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'

import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles/makeStyles'

import { TileShadow } from './TileShadow'

const borderRadius = 8

const useStyles = makeStyles(({ palette }) => {
  return {
    tile: {
      flexDirection: 'row',
      borderColor: palette.neutralLight8,
      backgroundColor: palette.white,
      borderWidth: 1,
      borderRadius
    },
    content: {
      flex: 1
    }
  }
})

const defaultElement = View

type TilePressableProps = Pick<
  PressableProps,
  'onPress' | 'onPressIn' | 'onPressOut'
>

type TileOwnProps<
  TileComponentType extends ComponentType = ComponentType
> = TilePressableProps & {
  children: ReactNode
  scaleTo?: number
  style?: StyleProp<ViewStyle>
  styles?: StylesProp<{
    // styles for root element
    root: ViewStyle
    // styles for tile element, the view that establishes the border
    tile: ViewStyle
    // styles for the inner view that displays the tile content
    content: ViewStyle
  }>
  as?: TileComponentType
}

export type TileProps<
  TileComponentType extends ComponentType = typeof defaultElement
> = TileOwnProps<TileComponentType> &
  Omit<ComponentProps<TileComponentType>, keyof TileOwnProps>

export const Tile = <
  TileComponentType extends ComponentType = typeof defaultElement
>(
  props: TileProps<TileComponentType>
) => {
  const styles = useStyles()

  const {
    as: TileComponent = defaultElement,
    children,
    onPress,
    onPressIn,
    onPressOut,
    style,
    styles: stylesProp,
    scaleTo,
    ...other
  } = props

  const {
    scale,
    handlePressIn: handlePressInScale,
    handlePressOut: handlePressOutScale
  } = usePressScaleAnimation(scaleTo)

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      onPressIn?.(event)
      if (onPress) {
        handlePressInScale()
      }
    },
    [onPressIn, onPress, handlePressInScale]
  )

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      onPressOut?.(event)
      if (onPress) {
        handlePressOutScale()
      }
    },
    [onPressOut, onPress, handlePressOutScale]
  )

  return (
    <Animated.View
      style={[style, stylesProp?.root, { transform: [{ scale }] }]}
    >
      <TileShadow
        offset={[0, 0]}
        distance={1}
        startColor='rgba(133, 129, 153, 0.1)'
        borderRadius={borderRadius}
        inset={0}
      />
      <TileShadow
        offset={[0, 1]}
        distance={0}
        startColor='#e3e3e3'
        borderRadius={borderRadius}
        inset={0}
      />
      <TileShadow
        offset={[0, 2]}
        distance={7}
        startColor='rgba(133, 129, 153, 0.1)'
        borderRadius={borderRadius}
        inset={4}
      />
      <TileComponent style={[styles.tile, stylesProp?.tile]} {...other}>
        <Pressable
          style={[styles.content, stylesProp?.content, { borderRadius: 4 }]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {children}
        </Pressable>
      </TileComponent>
    </Animated.View>
  )
}
