import { View, Text, Image } from 'react-native'

import WavingHand from 'app/assets/images/emojis/waving-hand-sign.png'
import { makeStyles } from 'app/styles'

const messages = {
  newMessage: 'New Message',
  sayHello: 'Say Hello!',
  firstImpressions: 'First impressions are important, so make it count!'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  emptyContainer: {
    marginTop: spacing(8),
    marginHorizontal: spacing(6),
    padding: spacing(6),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.neutralLight7,
    borderWidth: 1,
    borderRadius: spacing(2)
  },
  emptyTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginHorizontal: spacing(6)
  },
  wavingHand: {
    height: spacing(16),
    width: spacing(16)
  },
  emptyTitle: {
    fontSize: typography.fontSize.xxl,
    color: palette.neutral,
    fontFamily: typography.fontByWeight.bold,
    lineHeight: typography.fontSize.xxl * 1.3
  },
  emptyText: {
    marginTop: spacing(2),
    marginRight: spacing(6),
    fontSize: typography.fontSize.large,
    lineHeight: typography.fontSize.large * 1.3,
    color: palette.neutral
  }
}))

export const EmptyChatMessages = () => {
  const styles = useStyles()
  return (
    <View style={styles.emptyContainer}>
      <Image style={styles.wavingHand} source={WavingHand} />
      <View style={styles.emptyTextContainer}>
        <Text style={styles.emptyTitle}>{messages.sayHello}</Text>
        <Text style={styles.emptyText}>{messages.firstImpressions}</Text>
      </View>
    </View>
  )
}
