import { useCallback } from 'react'

import { Image, ImageStyle, Linking, StyleSheet, View } from 'react-native'

import AudiusAPI from 'app/assets/images/audiusAPI.png'
import ButtonWithArrow from 'app/components/button-with-arrow'
import { GradientText } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

const messages = {
  modalTitle: 'Audius API',
  title: "It's easy to build your own app on Audius",
  description: 'The top 10 Audius API apps each month win',
  button: 'Learn More About The Audius API'
}

const API_LINK = 'https://audius.org/api'
const MODAL_NAME = 'APIRewardsExplainer'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: 32,
      display: 'flex',
      alignItems: 'center'
    },
    drawerTitle: {
      marginTop: 8,
      marginBottom: 32,
      fontSize: 28
    },
    image: {
      height: 100,
      width: 120,
      marginBottom: 32
    },
    title: {
      marginBottom: 24,
      color: themeColors.secondary,
      fontSize: 24,
      textAlign: 'center'
    },
    subtitle: {
      color: themeColors.neutralLight4,
      marginBottom: 24
    },
    buttonText: {
      fontSize: 16
    }
  })

export const ApiRewardsDrawer = () => {
  const styles = useThemedStyles(createStyles)

  const onClickAudiusAPI = useCallback(() => {
    Linking.openURL(API_LINK)
  }, [])

  return (
    <AppDrawer modalName={MODAL_NAME}>
      <View style={styles.content}>
        <GradientText style={styles.drawerTitle}>
          {messages.modalTitle}
        </GradientText>
        <Image style={styles.image as ImageStyle} source={AudiusAPI} />
        <Text style={styles.title} weight='bold'>
          {messages.title}
        </Text>
        <Text style={styles.subtitle} weight='bold'>
          {messages.description}
        </Text>
        <ButtonWithArrow
          title={messages.button}
          textStyle={styles.buttonText}
          onPress={onClickAudiusAPI}
        />
      </View>
    </AppDrawer>
  )
}
