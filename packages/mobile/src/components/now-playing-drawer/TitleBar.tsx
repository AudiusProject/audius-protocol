import { View } from 'react-native'

import { IconCaretRight } from '@audius/harmony-native'
import Text from 'app/components/text'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const messages = {
  nowPlaying: 'NOW PLAYING'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    marginTop: spacing(4),
    marginHorizontal: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  caret: {
    transform: [{ rotate: '90deg' }]
  },
  text: {
    fontSize: 18,
    color: palette.neutralLight4
  },
  offsetRight: {
    width: 24
  }
}))

type TitleBarProps = {
  onClose: () => void
}

export const TitleBar = ({ onClose }: TitleBarProps) => {
  const styles = useStyles()
  const caretColor = useColor('neutralLight4')
  return (
    <View style={styles.root}>
      <IconCaretRight
        width={24}
        height={24}
        fill={caretColor}
        style={styles.caret}
        onPress={onClose}
        hitSlop={{ top: 4, right: 4, left: 4, bottom: 4 }}
      />
      <Text style={styles.text} weight='heavy'>
        {messages.nowPlaying}
      </Text>
      <View style={styles.offsetRight} />
    </View>
  )
}
