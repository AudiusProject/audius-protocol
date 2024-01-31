import { TouchableOpacity } from 'react-native'

import { IconCopy } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  copy: 'Copy Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5)
  },
  copyText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.bold,
    color: palette.staticWhite
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
  const { staticWhite } = useThemeColors()

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.root,
        {
          top: messageTop - containerTop + messageHeight + spacing(5),
          right: isAuthor ? spacing(6) : undefined,
          left: isAuthor ? undefined : spacing(6)
        }
      ]}
    >
      <IconCopy fill={staticWhite} height={12} width={12} />
      <Text style={styles.copyText} fontSize='xs' weight='bold'>
        {messages.copy}
      </Text>
    </TouchableOpacity>
  )
}
