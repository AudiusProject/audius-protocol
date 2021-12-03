import React, { useCallback } from 'react'

import MaskedView from '@react-native-masked-view/masked-view'
import {
  getModalVisibility,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import Drawer from 'app/components/drawer'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

const MODAL_NAME = 'MobileConnectWalletsDrawer'

const messages = {
  title: 'Connect Wallets',
  text:
    'To connect additional wallets please visit audius.co from a desktop browser'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingTop: 48,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 48
    },

    title: {
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 28,
      marginTop: 24,
      marginBottom: 24
    },

    text: {
      textAlign: 'center',
      fontWeight: '500',
      fontSize: 24,
      lineHeight: 30
    }
  })

const ConnectWalletsDrawer = () => {
  const styles = useThemedStyles(createStyles)
  const isOpen = useSelectorWeb(state => getModalVisibility(state, MODAL_NAME))
  const dispatchWeb = useDispatchWeb()
  const {
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()

  const handleClose = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: false }))
  }, [dispatchWeb])

  return (
    <Drawer onClose={handleClose} isOpen={isOpen}>
      <View style={styles.container}>
        <MaskedView
          maskElement={<Text style={styles.title}>{messages.title}</Text>}
        >
          <LinearGradient
            colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
          >
            <Text style={[styles.title, { opacity: 0 }]}>{messages.title}</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.text}>{messages.text}</Text>
      </View>
    </Drawer>
  )
}

export default ConnectWalletsDrawer
