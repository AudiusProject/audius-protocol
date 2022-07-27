import type { ReactNode } from 'react'

import { View } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(3)
  }
}))

type SettingsRowContentProps = {
  children: ReactNode
}

export const SettingsRowContent = (props: SettingsRowContentProps) => {
  const { children } = props
  const styles = useStyles()
  return <View style={styles.root}>{children}</View>
}
