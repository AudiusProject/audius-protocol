import type { StyleProp, ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native'

import { IconPause, IconPlay } from '@audius/harmony-native'

type TablePlayButtonProps = {
  playing?: boolean
  paused: boolean
  onPress?: () => void
  styles?: {
    root: StyleProp<ViewStyle>
    svg: StyleProp<ViewStyle>
  }
}

export const TablePlayButton = ({
  playing = false,
  paused,
  onPress = () => {},
  styles: propStyles
}: TablePlayButtonProps) => {
  return (
    <TouchableOpacity style={propStyles?.root} onPress={onPress}>
      {playing && !paused ? (
        <IconPause color='white' style={propStyles?.svg} />
      ) : (
        <IconPlay color='default' style={propStyles?.svg} />
      )}
    </TouchableOpacity>
  )
}
