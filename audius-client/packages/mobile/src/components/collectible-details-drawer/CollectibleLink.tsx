import React, { useCallback } from 'react'

import {
  Linking,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native'

import IconLink from '../../assets/images/iconLink.svg'
import { useColor } from '../../utils/theme'
import { ThemeColors, useThemedStyles } from '../../hooks/useThemedStyles'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    link: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20
    },

    linkText: {
      color: themeColors.secondary,
      fontFamily: 'AvenirNextLTPro-Heavy',
      textDecorationLine: 'underline'
    },

    linkIcon: {
      marginRight: 6
    }
  })

export const CollectibleLink = ({
  url,
  text
}: {
  url: string
  text: string
}) => {
  const styles = useThemedStyles(createStyles)
  const handleLinkPress = useCallback(() => {
    Linking.openURL(url)
  }, [url])

  const secondaryColor = useColor('secondary')

  return (
    <TouchableWithoutFeedback onPress={handleLinkPress}>
      <View style={styles.link}>
        <IconLink
          fill={secondaryColor}
          style={styles.linkIcon}
          height={16}
          width={16}
        />
        <Text style={styles.linkText}>{text}</Text>
      </View>
    </TouchableWithoutFeedback>
  )
}
