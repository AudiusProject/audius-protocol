import React, { useCallback } from 'react'

import MaskedView from '@react-native-masked-view/masked-view'
import {
  getModalVisibility,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconGold from 'app/assets/images/IconGoldBadge.svg'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemeColors } from 'app/utils/theme'

import Drawer from '../drawer'

const TRANSFER_AUDIO_MODAL_NAME = 'TransferAudioMobileWarning'

const styles = StyleSheet.create({
  drawer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 32
  },

  badge: {
    marginBottom: 24
  },

  title: {
    fontFamily: 'AvenirNextLTPro-Heavy',
    fontSize: 28,
    marginBottom: 24
  },

  subtitle: {
    fontFamily: 'AvenirNextLTPro-Light',
    textAlign: 'center',
    fontSize: 24,
    maxWidth: 300,
    lineHeight: 30
  }
})

const messages = {
  title: 'Transfer $AUDIO',
  subtitle: 'To transfer AUDIO please visit audius.co from a desktop browser'
}

const TransferAudioMobileDrawer = () => {
  const dispatchWeb = useDispatchWeb()
  const {
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()
  const isOpen = useSelectorWeb(state =>
    getModalVisibility(state, TRANSFER_AUDIO_MODAL_NAME)
  )

  const handleClose = useCallback(() => {
    dispatchWeb(
      setVisibility({ modal: TRANSFER_AUDIO_MODAL_NAME, visible: false })
    )
  }, [dispatchWeb])

  return (
    <Drawer isOpen={isOpen} onClose={handleClose}>
      <View style={styles.drawer}>
        <IconGold style={styles.badge} height={134} width={134} />
        <MaskedView
          maskElement={
            <Text style={styles.title} weight='heavy'>
              {messages.title}
            </Text>
          }
        >
          <LinearGradient
            colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
          >
            <Text style={[styles.title, { opacity: 0 }]}>{messages.title}</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.subtitle}>{messages.subtitle}</Text>
      </View>
    </Drawer>
  )
}

export default TransferAudioMobileDrawer
