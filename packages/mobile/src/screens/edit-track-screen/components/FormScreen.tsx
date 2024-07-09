import type { ReactElement, ReactNode } from 'react'

import { View } from 'react-native'

import { Button } from '@audius/harmony-native'
import type { ScreenProps } from 'app/components/core'
import { ScreenContent, Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const messages = {
  done: 'Done'
}

type FormScreenProps = Omit<ScreenProps, 'children'> & {
  bottomSection?: ReactNode
  children: ReactElement
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: { justifyContent: 'space-between' },
  bottomSection: {
    paddingHorizontal: spacing(4),
    paddingTop: spacing(6),
    paddingBottom: spacing(12),
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight6
  }
}))

export const FormScreen = (props: FormScreenProps) => {
  const { children, bottomSection, style: styleProp, ...other } = props
  const styles = useStyles()
  const navigation = useNavigation()

  const defaultBottomSection = (
    <Button variant='primary' fullWidth onPress={navigation.goBack}>
      {messages.done}
    </Button>
  )

  return (
    <Screen variant='secondary' style={[styles.root, styleProp]} {...other}>
      <ScreenContent>
        {children}
        <View style={styles.bottomSection}>
          {bottomSection ?? defaultBottomSection}
        </View>
      </ScreenContent>
    </Screen>
  )
}
