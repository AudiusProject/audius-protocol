import { useContext, useCallback } from 'react'

import Clipboard from '@react-native-clipboard/clipboard'
import { Animated, StyleSheet, View, TouchableHighlight } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconCopy from 'app/assets/images/iconCopy.svg'
import Text from 'app/components/text'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

import { ToastContext } from '../toast/ToastContext'

const messages = {
  copyPrompt: 'Copy Invite to Clipboard',
  copyNotice: 'Referral link copied to the clipboard'
}
const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    copyPromptContainer: {
      width: '100%'
    },
    borderRadius: {
      borderRadius: 6
    },
    copyTextContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12
    },
    copyText: {
      fontSize: 18,
      textAlign: 'center',
      color: themeColors.staticWhite
    },
    iconCopy: {
      color: themeColors.staticWhite,
      lineHeight: 16,
      marginRight: 8
    }
  })

export const ReferralLinkCopyButton = ({
  inviteUrl
}: {
  inviteUrl: string
}) => {
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()
  const styles = useThemedStyles(createStyles)

  const { toast } = useContext(ToastContext)
  const onCopyClicked = useCallback(() => {
    Clipboard.setString(inviteUrl)
    toast({ content: messages.copyNotice, type: 'info' })
  }, [inviteUrl, toast])

  // Button animation
  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation()
  return (
    <Animated.View
      style={[styles.copyPromptContainer, { transform: [{ scale }] }]}
    >
      <TouchableHighlight
        style={styles.borderRadius}
        onPress={onCopyClicked}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          style={[styles.borderRadius]}
          angleCenter={{ x: 0.5, y: 0.5 }}
          angle={350}
          useAngle={true}
          colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
          locations={[0.0204, 1]}
        >
          <View style={styles.copyTextContainer}>
            <IconCopy style={styles.iconCopy} width={24} height={24} />
            <Text weight={'bold'} style={styles.copyText}>
              {messages.copyPrompt}
            </Text>
          </View>
        </LinearGradient>
      </TouchableHighlight>
    </Animated.View>
  )
}
