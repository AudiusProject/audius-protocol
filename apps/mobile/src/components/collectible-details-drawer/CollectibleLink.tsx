import { useCallback } from 'react'

import {
  Linking,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from 'react-native'

import IconLink from 'app/assets/images/iconLink.svg'
import Text from 'app/components/text'
import type { ThemeColors } from 'app/hooks/useThemedStyles'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useThemeColors } from 'app/utils/theme'

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
        <Text style={styles.linkText} weight='demiBold'>
          {text}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  )
}
