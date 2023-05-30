import { View, Text } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  unreadTagContainer: {
    marginVertical: spacing(6),
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  unreadSeparator: {
    height: 1,
    backgroundColor: palette.neutralLight5,
    flexGrow: 1
  },
  unreadTag: {
    color: palette.white,
    fontSize: typography.fontSize.xxs,
    fontFamily: typography.fontByWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: palette.neutralLight5,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: spacing(0.5)
  }
}))

export const ChatMessageSeparator = ({ content }: { content: string }) => {
  const styles = useStyles()

  return (
    <View style={styles.unreadTagContainer}>
      <View style={styles.unreadSeparator} />
      <Text style={styles.unreadTag}>{content}</Text>
      <View style={styles.unreadSeparator} />
    </View>
  )
}
