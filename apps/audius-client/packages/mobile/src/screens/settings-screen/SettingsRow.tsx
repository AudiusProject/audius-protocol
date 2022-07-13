import { ReactNode } from 'react'

import { Pressable, StyleProp, View, ViewStyle } from 'react-native'

import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import { Link } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ palette, spacing }) => ({
  firstItem: {
    borderTopColor: palette.neutralLight8,
    borderTopWidth: 1
  },
  root: {
    backgroundColor: palette.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(5),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  content: {
    flex: 1
  }
}))

type SettingsRowProps = {
  onPress?: () => void
  url?: string
  children: ReactNode
  firstItem?: boolean
  style?: StyleProp<ViewStyle>
}

export const SettingsRow = (props: SettingsRowProps) => {
  const { onPress, children, firstItem, style, url } = props
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()

  const Root = url ? Link : Pressable

  return (
    <Root
      url={url as string}
      onPress={onPress}
      style={[styles.root, firstItem && styles.firstItem, style]}>
      <View style={styles.content}>{children}</View>
      {onPress || url ? (
        <IconCaretRight fill={neutralLight4} height={16} width={16} />
      ) : null}
    </Root>
  )
}
