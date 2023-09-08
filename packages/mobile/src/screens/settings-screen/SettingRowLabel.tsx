import type { ComponentType } from 'react'

import type { TextStyle, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles'
import type { SvgProps } from 'app/types/svg'
import { useThemePalette } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing }) => ({
  root: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    height: spacing(4),
    width: spacing(4),
    marginRight: spacing(2)
  }
}))

type SettingsRowLabelProps = {
  label: string
  icon?: ComponentType<SvgProps>
} & StylesProps<{ root?: ViewStyle; label: TextStyle }>

export const SettingsRowLabel = (props: SettingsRowLabelProps) => {
  const { label, styles: stylesProp, style, icon: Icon } = props
  const palette = useThemePalette()
  const styles = useStyles()

  return (
    <View style={[styles.root, style, stylesProp?.root]}>
      {Icon ? (
        <Icon
          height={styles.icon.height}
          width={styles.icon.width}
          fill={palette.neutral}
          fillSecondary={palette.white}
          style={styles.icon}
        />
      ) : null}
      <Text
        fontSize='small'
        weight='demiBold'
        color='neutral'
        style={stylesProp?.label}
      >
        {label}
      </Text>
    </View>
  )
}
