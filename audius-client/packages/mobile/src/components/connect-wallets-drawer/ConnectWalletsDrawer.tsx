import { StyleSheet, View } from 'react-native'

import { GradientText } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'

const MODAL_NAME = 'MobileConnectWalletsDrawer'

const messages = {
  title: 'Connect Wallets',
  text: 'To connect additional wallets please visit audius.co from a desktop browser'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingVertical: 48,
      paddingHorizontal: 16
    },

    title: {
      textAlign: 'center',
      fontSize: 28,
      marginVertical: 24
    },

    text: {
      textAlign: 'center',
      fontSize: 24,
      lineHeight: 30
    }
  })

export const ConnectWalletsDrawer = () => {
  const styles = useThemedStyles(createStyles)

  return (
    <AppDrawer modalName={MODAL_NAME}>
      <View style={styles.container}>
        <GradientText style={styles.title}>{messages.title}</GradientText>
        <Text style={styles.text} weight='medium'>
          {messages.text}
        </Text>
      </View>
    </AppDrawer>
  )
}
