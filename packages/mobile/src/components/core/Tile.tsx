import { ReactNode } from 'react'

import { Pressable, View, ViewStyle } from 'react-native'
import { Shadow } from 'react-native-shadow-2'

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

export type TileProps = {
  children: ReactNode
  onPress?: GestureResponderHandler
  style?: ViewStyle
  styles?: {
    // styles for root element
    root?: ViewStyle
    // styles for tile element, the view that establishes the border
    tile?: ViewStyle
    // styles for the inner view that displays the tile content
    content?: ViewStyle
  }
}

export const Tile = ({
  children,
  onPress,
  style,
  styles: stylesProp
}: TileProps) => {
  const styles = useStyles()
  return (
    <Shadow
      offset={[0, 2]}
      viewStyle={{ alignSelf: 'stretch' }}
      distance={4}
      startColor='rgba(133,129,153,0.05)'
      containerViewStyle={[style, stylesProp?.root]}
    >
      <View style={[styles.tile, stylesProp?.tile]}>
        <Pressable
          style={[styles.content, stylesProp?.content]}
          onPress={onPress}
        >
          {children}
        </Pressable>
      </View>
    </Shadow>
  )
}
