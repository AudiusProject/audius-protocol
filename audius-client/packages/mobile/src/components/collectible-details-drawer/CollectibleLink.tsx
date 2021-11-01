import React, { useCallback } from 'react'

import {
  Linking,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from 'react-native'

import IconLink from '../../assets/images/iconLink.svg'
import Text from '../../components/text'
import { useThemeColors } from '../../utils/theme'
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

  const { secondary } = useThemeColors()

  return (
    <TouchableWithoutFeedback onPress={handleLinkPress}>
      <View style={styles.link}>
        <IconLink
          fill={secondary}
          style={styles.linkIcon}
          height={16}
          width={16}
        />
        <Text style={styles.linkText} weight='heavy'>
          {text}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  )
}
