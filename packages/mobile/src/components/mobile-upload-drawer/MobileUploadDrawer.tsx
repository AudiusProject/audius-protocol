import { Image, View } from 'react-native'

import checkMark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconUpload from 'app/assets/images/iconUpload.svg'
import { Text, GradientText, GradientIcon } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer/AppDrawer'
import { makeStyles } from 'app/styles'

export const MODAL_NAME = 'MobileUpload'

const messages = {
  title: 'Start Uploading',
  description: 'Visit audius.co from a desktop browser',
  unlimited: 'Unlimited Uploads',
  clear: 'Crystal Clear 320kbps',
  exclusive: 'Exclusive Content'
}

const checks = [messages.unlimited, messages.clear, messages.exclusive]

const useStyles = makeStyles(({ typography, spacing }) => ({
  drawer: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(9)
  },
  top: {
    alignItems: 'center',
    marginBottom: spacing(6)
  },
  icon: {
    height: 80,
    width: 80
  },
  title: {
    fontSize: typography.fontSize.xxxxl,
    fontFamily: typography.fontByWeight.heavy,
    marginBottom: spacing(2)
  },
  description: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontByWeight.medium,
    textAlign: 'center'
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bulletIcon: {
    width: spacing(6),
    height: spacing(6),
    marginRight: spacing(4)
  },
  bulletText: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontByWeight.bold,
    lineHeight: 40
  }
}))

export const MobileUploadDrawer = () => {
  const styles = useStyles()

  return (
    <AppDrawer modalName={MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.top}>
          <GradientIcon {...styles.icon} icon={IconUpload} />
          <GradientText style={styles.title}>{messages.title}</GradientText>
          <Text style={styles.description}>{messages.description}</Text>
        </View>
        {checks.map((bulletText) => (
          <View key={bulletText} style={styles.bullet}>
            <Image source={checkMark} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>{bulletText}</Text>
          </View>
        ))}
      </View>
    </AppDrawer>
  )
}
