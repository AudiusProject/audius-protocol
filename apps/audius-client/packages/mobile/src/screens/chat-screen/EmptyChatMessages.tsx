import { View, Text, Image } from 'react-native'

import WavingHand from 'app/assets/images/emojis/waving-hand-sign.png'
import { makeStyles } from 'app/styles'

const messages = {
  newMessage: 'New Message',
  sayHello: 'Say Hello!',
  firstImpressions: 'First impressions are important, so make it count!'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginTop: spacing(8),
    padding: spacing(6),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.neutralLight7,
    borderWidth: 1,
    borderRadius: spacing(2)
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginHorizontal: spacing(6)
  },
  wavingHand: {
    height: spacing(16),
    width: spacing(16)
  },
  title: {
    fontSize: typography.fontSize.xxl,
    color: palette.neutral,
    fontFamily: typography.fontByWeight.bold,
    lineHeight: typography.fontSize.xxl * 1.3
  },
  text: {
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
    <View style={styles.root}>
      <Image style={styles.wavingHand} source={WavingHand} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{messages.sayHello}</Text>
        <Text style={styles.text}>{messages.firstImpressions}</Text>
      </View>
    </View>
  )
}
