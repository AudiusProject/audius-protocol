import { useState } from 'react'

import { Text, Pressable, Animated } from 'react-native'

import IconCopy from 'app/assets/images/iconCopy2.svg'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

const messages = {
  copy: 'Copy Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  copyPressableContainer: {
    position: 'absolute',
    dipslay: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CONTENT
  },
  copyAnimatedContainer: {
    dipslay: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CONTENT
  },
  copyText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.bold,
    color: palette.white
  }
}))

type CopyMessagesButtonProps = {
  messageTop: number
  messageHeight: number
  containerTop: number
  isAuthor: boolean
  onPress: () => void
}

export const CopyMessagesButton = ({
  messageTop,
  messageHeight,
  isAuthor,
  containerTop,
  onPress
}: CopyMessagesButtonProps) => {
  const styles = useStyles()
  const { white } = useThemeColors()
  const [isPressed, setIsPressed] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.copyPressableContainer,
        {
          top: messageTop - containerTop + messageHeight + spacing(2.5),
          right: isAuthor ? spacing(6) : undefined,
          left: isAuthor ? undefined : spacing(6)
        }
      ]}
    >
      <Animated.View
        style={[styles.copyAnimatedContainer, { opacity: isPressed ? 0.5 : 1 }]}
      >
        <IconCopy fill={white} height={12} width={12} />
        <Text style={styles.copyText}>{messages.copy}</Text>
      </Animated.View>
    </Pressable>
  )
}
