import type { StyleProp, ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native'

import { IconPause } from '@audius/harmony-native'
import { IconPlay } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

type TablePlayButtonProps = {
  playing?: boolean
  paused: boolean
  hideDefault?: boolean
  onPress?: () => void
  styles?: {
    root: StyleProp<ViewStyle>
    svg: StyleProp<ViewStyle>
  }
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {},
  svg: {},
  hideDefault: {}
}))

export const TablePlayButton = ({
  playing = false,
  paused,
  hideDefault = true,
  onPress = () => {},
  styles: propStyles
}: TablePlayButtonProps) => {
  const styles = useStyles()

  return (
    <TouchableOpacity style={[styles.root, propStyles?.root]} onPress={onPress}>
      {playing && !paused ? (
        <IconPause style={[styles.svg, propStyles?.svg]} />
      ) : (
        <IconPlay
          style={[
            styles.svg,
            hideDefault && !playing ? styles.hideDefault : {},
            propStyles?.svg
          ]}
        />
      )}
    </TouchableOpacity>
  )
}
