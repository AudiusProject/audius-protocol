import { ComponentProps, ComponentType, ReactNode } from 'react'

import { Pressable, StyleProp, View, ViewStyle } from 'react-native'
import { Shadow } from 'react-native-shadow-2'

import { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles/makeStyles'
import { GestureResponderHandler } from 'app/types/gesture'

const useStyles = makeStyles(({ palette }) => ({
  tile: {
    flexDirection: 'row',
    borderColor: palette.neutralLight8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderRadius: 8
  },
  content: {
    flex: 1
  }
}))

const defaultElement = View

type TileOwnProps<TileComponentType extends ComponentType = ComponentType> = {
  children: ReactNode
  onPress?: GestureResponderHandler
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
    style,
    styles: stylesProp,
    ...other
  } = props

  return (
    <Shadow
      offset={[0, 1]}
      viewStyle={{ alignSelf: 'stretch' }}
      distance={2}
      startColor='rgba(133,129,153,0.11)'
      containerViewStyle={[style, stylesProp?.root]}
    >
      <TileComponent style={[styles.tile, stylesProp?.tile]} {...other}>
        <Pressable
          style={[styles.content, stylesProp?.content]}
          onPress={onPress}
        >
          {children}
        </Pressable>
      </TileComponent>
    </Shadow>
  )
}
