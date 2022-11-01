import type { ReactElement, ReactNode } from 'react'

import { View } from 'react-native'

import type { ScreenProps } from 'app/components/core'
import { Screen } from 'app/components/core'
import { makeStyles } from 'app/styles'

type UploadStackScreenProps = Omit<ScreenProps, 'children'> & {
  bottomSection: ReactNode
  children: ReactElement
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: { justifyContent: 'space-between' },
  bottomSection: {
    padding: spacing(4),
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight6
  }
}))

export const UploadStackScreen = (props: UploadStackScreenProps) => {
  const { children, bottomSection, style: styleProp, ...other } = props
  const styles = useStyles()

  return (
    <Screen variant='secondary' style={[styles.root, styleProp]} {...other}>
      {children}
      <View style={styles.bottomSection}>{bottomSection}</View>
    </Screen>
  )
}
