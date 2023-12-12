import type { ComponentType, ReactNode } from 'react'

import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(2)
  },
  text: {
    color: palette.neutralLight4,
    textTransform: 'uppercase'
  }
}))

type SecondaryScreenTitleProps = {
  icon?: ComponentType<SvgProps>
  IconProps?: SvgProps
  title: ReactNode
}
export const SecondaryScreenTitle = (props: SecondaryScreenTitleProps) => {
  const { icon: Icon, IconProps, title } = props
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()

  return (
    <View style={styles.root}>
      {Icon ? (
        <Icon
          color={"accent"}
          style={styles.icon}
          fill={neutralLight4}
          height={spacing(6)}
          width={spacing(6)}
          {...IconProps}
        />
      ) : null}
      <Text
        fontSize='large'
        weight='heavy'
        accessibilityRole='header'
        style={styles.text}
      >
        {title}
      </Text>
    </View>
  )
}
