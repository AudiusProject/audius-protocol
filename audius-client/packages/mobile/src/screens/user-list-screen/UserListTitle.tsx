import { ComponentType } from 'react'

import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(3)
  },
  text: {
    color: palette.neutralLight2
  }
}))

type UserListTitleProps = {
  icon: ComponentType<SvgProps>
  title: JSX.Element | string
}
export const UserListTitle = (props: UserListTitleProps) => {
  const { icon: Icon, title } = props
  const styles = useStyles()
  const { neutralLight2 } = useThemeColors()

  return (
    <View style={styles.root}>
      <Icon style={styles.icon} fill={neutralLight2} height={20} width={20} />
      <Text
        variant='h1'
        accessibilityRole='header'
        noGutter
        style={styles.text}
      >
        {title}
      </Text>
    </View>
  )
}
