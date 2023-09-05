import { Platform, View } from 'react-native'

import IconDownload from 'app/assets/images/iconDownload.svg'
import { Button, GradientText, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const ANDROID_PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=co.audius.app'
const IOS_APP_STORE_LINK = 'itms-apps://us/app/audius-music/id1491270519'

const messages = {
  header: 'Please Update ✨',
  text: "The version of Audius you're running is too far behind.",
  buttonText: 'Update App'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  contentContainer: {
    paddingTop: spacing(32),
    paddingBottom: spacing(8),
    paddingHorizontal: spacing(6)
  },
  header: {
    fontSize: 24,
    lineHeight: 52,
    textAlign: 'center',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 4,
    textShadowColor: 'rgba(162,47,235,0.2)'
  },
  text: {
    textAlign: 'center',
    marginBottom: spacing(8),
    marginTop: spacing(6)
  }
}))

export const UpdateRequiredScreen = () => {
  const styles = useStyles()
  const isAndroid = Platform.OS === 'android'
  const url = isAndroid ? ANDROID_PLAY_STORE_LINK : IOS_APP_STORE_LINK

  return (
    <View style={styles.contentContainer}>
      <GradientText accessibilityRole='header' style={styles.header}>
        {messages.header}
      </GradientText>
      <Text variant='h1' style={styles.text}>
        {messages.text}
      </Text>
      <Button
        title={messages.buttonText}
        size='large'
        icon={IconDownload}
        iconPosition='left'
        url={url}
      />
    </View>
  )
}
