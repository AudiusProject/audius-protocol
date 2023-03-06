import type { ReactNode } from 'react'

import type { ViewStyle } from 'react-native'
import { View } from 'react-native'

import IconQuestionCircle from 'app/assets/images/iconQuestionCircle.svg'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2),
    backgroundColor: palette.neutralLight9
  },
  text: {
    flex: 1,
    flexWrap: 'wrap'
  },
  questionIcon: {
    marginRight: spacing(4),
    width: spacing(5),
    height: spacing(5)
  }
}))

type HelpCalloutProps = {
  content: ReactNode
  style?: ViewStyle
}

export const HelpCallout = ({ content, style }: HelpCalloutProps) => {
  const styles = useStyles()
  const neutral = useColor('neutral')

  return (
    <View style={[styles.root, style]}>
      <IconQuestionCircle style={styles.questionIcon} fill={neutral} />
      <Text style={styles.text}>{content}</Text>
    </View>
  )
}
