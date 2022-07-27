import type { ComponentType, ReactNode } from 'react'

import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ palette }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1,
    paddingBottom: spacing(4),
    marginBottom: spacing(4)
  },
  iconColor: {
    color: palette.secondary
  },
  icon: {
    marginRight: spacing(2)
  }
}))

type NotificationHeaderProps = {
  icon: ComponentType<SvgProps>
  children: ReactNode
}

export const NotificationHeader = (props: NotificationHeaderProps) => {
  const styles = useStyles()
  const { icon: Icon, children } = props
  return (
    <View style={styles.root}>
      <Icon
        fill={styles.iconColor.color}
        height={30}
        width={30}
        style={styles.icon}
      />
      {children}
    </View>
  )
}
