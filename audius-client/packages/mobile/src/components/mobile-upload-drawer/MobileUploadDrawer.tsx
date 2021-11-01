import React from 'react'

import { Image, StyleSheet, View } from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'

import IconUpload from '../../assets/images/iconGradientUpload.svg'
import HeavyCheckMark from '../../assets/images/emojis/white-heavy-check-mark.png'
import Text from '../../components/text'
import { getIsOpen } from 'audius-client/src/common/store/ui/mobile-upload-drawer/selectors'
import { hide } from 'audius-client/src/common/store/ui/mobile-upload-drawer/slice'

import Drawer from '../drawer'
import { useSelectorWeb } from '../../hooks/useSelectorWeb'
import { useDispatchWeb } from '../../hooks/useDispatchWeb'
import { useThemeColors } from '../../utils/theme'
import LinearGradient from 'react-native-linear-gradient'

const styles = StyleSheet.create({
  drawer: {
    height: 460,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    width: '100%',
    padding: 16
  },

  cta: {
    marginTop: 16,
    fontSize: 32,
    lineHeight: 34,
    textAlign: 'center'
  },

  visit: {
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    marginTop: 4
  },

  top: {
    display: 'flex',
    marginTop: 0,
    flexDirection: 'column',
    alignItems: 'center'
  },

  bottom: {
    marginBottom: 16
  },

  action: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },

  actionLabel: {
    fontSize: 24,
    lineHeight: 40
  },

  iconCheck: {
    marginRight: 16,
    height: 24,
    width: 24
  }
})

const messages = {
  start: 'Start Uploading',
  visit: 'Visit audius.co from a desktop browser',
  unlimited: 'Unlimited Uploads',
  exclusive: 'Exclusive Content',
  clear: 'Crystal Clear 320kbps'
}

const MobileUploadDrawer = () => {
  const isOpen = useSelectorWeb(getIsOpen)
  const dispatchWeb = useDispatchWeb()
  const close = () => dispatchWeb(hide())

  const {
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()

  const CheckMark = () => (
    <Image style={styles.iconCheck} source={HeavyCheckMark} />
  )

  return (
    <Drawer isOpen={isOpen} onClose={close}>
      <View style={styles.drawer}>
        <View style={styles.top}>
          <IconUpload
            height={66}
            width={66}
            fill={pageHeaderGradientColor2}
            fillSecondary={pageHeaderGradientColor1}
          />

          <MaskedView
            maskElement={
              <Text style={styles.cta} weight='heavy'>
                {messages.start}
              </Text>
            }
          >
            <LinearGradient
              colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
            >
              <Text style={[styles.cta, { opacity: 0 }]} weight='heavy'>
                {messages.start}
              </Text>
            </LinearGradient>
          </MaskedView>
          <View>
            <Text style={styles.visit}>{messages.visit}</Text>
          </View>
        </View>
        <View style={styles.bottom}>
          {[messages.unlimited, messages.clear, messages.exclusive].map(m => (
            <View style={styles.action} key={m}>
              <CheckMark />
              <Text style={styles.actionLabel} weight='bold'>
                {m}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Drawer>
  )
}

export default MobileUploadDrawer
