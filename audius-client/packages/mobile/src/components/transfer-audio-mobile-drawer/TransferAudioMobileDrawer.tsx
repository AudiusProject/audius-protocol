import React, { useCallback } from 'react'

import {
  getModalVisibility,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import { StyleSheet, View } from 'react-native'

import IconGold from 'app/assets/images/IconGoldBadge.svg'
import Drawer from 'app/components/drawer'
import GradientText from 'app/components/gradient-text'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

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
    fontFamily: 'AvenirNextLTPro-Regular',
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
        <GradientText text={messages.title} style={styles.title} />
        <Text style={styles.subtitle}>{messages.subtitle}</Text>
      </View>
    </Drawer>
  )
}

export default TransferAudioMobileDrawer
