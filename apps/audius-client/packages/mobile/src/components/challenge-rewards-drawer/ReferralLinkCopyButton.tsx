import React, { useContext, useCallback } from 'react'

import Clipboard from '@react-native-clipboard/clipboard'
import { getUserHandle } from 'audius-client/src/common/store/account/selectors'
import { Animated, StyleSheet, View, TouchableHighlight } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconCopy from 'app/assets/images/iconCopy.svg'
import Text from 'app/components/text'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

import { ToastContext } from '../toast/ToastContext'

const messages = {
  copyPrompt: 'Copy Invite Link',
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
    copyPromptContent: {
      padding: 16
    },
    copyPrompt: {
      marginBottom: 12,
      fontSize: 16,
      textTransform: 'uppercase',
      textAlign: 'center',
      color: themeColors.statTileText,
      letterSpacing: 1
    },
    copyText: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    referralUrl: {
      fontSize: 16,
      textAlign: 'center',
      color: themeColors.staticWhite
    },
    iconCopy: {
      color: themeColors.staticWhite,
      lineHeight: 16,
      marginLeft: 8
    }
  })

export const ReferralLinkCopyButton = () => {
  const {
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()
  const styles = useThemedStyles(createStyles)

  const handle = useSelectorWeb(getUserHandle)
  const referralUrl = `audius.co/signup?ref=${handle}`

  const { toast } = useContext(ToastContext)
  const onCopyClicked = useCallback(() => {
    Clipboard.setString(referralUrl)
    toast({ content: messages.copyNotice, type: 'info' })
  }, [referralUrl, toast])

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
          style={[styles.borderRadius, styles.copyPromptContent]}
          useAngle={true}
          angle={338}
          colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
        >
          <Text weight={'bold'} style={styles.copyPrompt}>
            {messages.copyPrompt}
          </Text>
          <View style={styles.copyText}>
            <Text weight={'bold'} style={styles.referralUrl}>
              {referralUrl}
            </Text>
            <IconCopy style={styles.iconCopy} width={16} height={16} />
          </View>
        </LinearGradient>
      </TouchableHighlight>
    </Animated.View>
  )
}
