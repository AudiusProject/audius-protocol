import type { ReactNode } from 'react'

import { View } from 'react-native'

import { makeStyles } from 'app/styles'

type NotificationBodyProps = {
  children: ReactNode
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(3)
  }
}))

export const NotificationBody = (props: NotificationBodyProps) => {
  const styles = useStyles()
  const { children } = props
  return <View style={styles.root}>{children}</View>
}
