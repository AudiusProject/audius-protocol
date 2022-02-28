import { ComponentType } from 'react'

import {
  ImageSourcePropType,
  Text,
  View,
  Image,
  TextStyle,
  ViewStyle
} from 'react-native'
import { SvgProps } from 'react-native-svg'

import { makeStyles, StylesProps } from 'app/styles'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: { flexDirection: 'row', alignItems: 'center' },
  label: { ...typography.body, color: palette.neutral },
  icon: {
    height: spacing(4),
    width: spacing(4),
    marginRight: spacing(1),
    fill: palette.neutral
  }
}))

type BaseProps = {
  label: string
} & StylesProps<{ root?: ViewStyle; label: TextStyle }>

type SettingsRowLabelProps =
  | BaseProps
  | (BaseProps & {
      iconSource: ImageSourcePropType
    })
  | (BaseProps & {
      icon: ComponentType<SvgProps>
    })

export const SettingsRowLabel = (props: SettingsRowLabelProps) => {
  const { label, styles: stylesProp, style } = props
  const styles = useStyles()

  const renderIcon = () => {
    if ('iconSource' in props) {
      const { iconSource } = props
      return <Image style={styles.icon} source={iconSource} />
    }
    if ('icon' in props) {
      const { icon: Icon } = props
      return (
        <Icon
          height={styles.icon.height}
          width={styles.icon.width}
          fill={styles.icon.fill}
          style={styles.icon}
        />
      )
    }
    return null
  }

  return (
    <View style={[styles.root, style, stylesProp?.root]}>
      {renderIcon()}
      <Text style={[styles.label, stylesProp?.label]}>{label}</Text>
    </View>
  )
}
