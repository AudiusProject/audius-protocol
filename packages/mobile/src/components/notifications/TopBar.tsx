import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform
} from 'react-native'
import IconRemove from '../../assets/images/iconRemove.svg'
import React from 'react'
import { useSpecialColor, useTheme } from '../../utils/theme'

const IS_IOS = Platform.OS === 'ios'

const messages = {
  notifications: 'NOTIFICATIONS'
}

const styles = StyleSheet.create({
  topBar: {
    height: IS_IOS ? 87 : 55
  },
  container: {
    position: 'absolute',
    bottom: 4,
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 4
  },
  text: {
    fontFamily: 'AvenirNextLTPro-Heavy',
    fontSize: 18
  },
  spacer: {
    width: 30
  }
})

type TopBarProps = {
  onClose: () => void
}

const TopBar = ({ onClose }: TopBarProps) => {
  const color = useSpecialColor('staticWhite', 'white')
  const topBarStyle = useTheme(styles.topBar, {
    backgroundColor: 'secondary'
  })
  return (
    <View style={topBarStyle}>
      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
          <IconRemove width={30} height={30} fill={color} />
        </TouchableOpacity>
        <Text
          style={[
            styles.text,
            {
              color
            }
          ]}
        >
          {messages.notifications}
        </Text>
        <View style={styles.spacer} />
      </View>
    </View>
  )
}

export default TopBar
