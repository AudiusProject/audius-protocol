import React from 'react'

import { StyleSheet, View } from 'react-native'

import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors, useColor } from 'app/utils/theme'

const messages = {
  nowPlaying: 'NOW PLAYING'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      marginTop: 64,
      marginLeft: 16,
      marginRight: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    caret: {
      transform: [{ rotate: '90deg' }]
    },
    text: {
      fontSize: 18,
      color: themeColors.neutralLight4
    },
    offsetRight: {
      width: 24
    }
  })

type TitleBarProps = {
  onClose: () => void
}

export const TitleBar = ({ onClose }: TitleBarProps) => {
  const styles = useThemedStyles(createStyles)
  const caretColor = useColor('neutralLight4')
  return (
    <View style={styles.root}>
      <IconCaretRight
        width={24}
        height={24}
        fill={caretColor}
        style={styles.caret}
        onPress={onClose}
        hitSlop={{ top: 4, right: 4, left: 4, bottom: 4 }}
      />
      <Text style={styles.text} weight='heavy'>
        {messages.nowPlaying}
      </Text>
      <View style={styles.offsetRight} />
    </View>
  )
}
