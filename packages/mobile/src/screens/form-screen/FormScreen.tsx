import { useCallback, type ReactNode } from 'react'

import { View } from 'react-native'

import type { ScreenProps } from 'app/components/core'
import { ScreenContent, Button, Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const messages = {
  done: 'Done'
}

export type FormScreenProps = ScreenProps & {
  bottomSection?: ReactNode
  onSubmit?: () => void
  onClear?: () => void
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
  const {
    children,
    style: styleProp,
    bottomSection,
    onClear,
    onSubmit,
    ...other
  } = props
  const styles = useStyles()
  const navigation = useNavigation()

  const handleSubmit = useCallback(() => {
    navigation.goBack()
    onSubmit?.()
  }, [])

  return (
    <Screen variant='secondary' style={[styles.root, styleProp]} {...other}>
      <ScreenContent>
        {children}
        <View style={styles.bottomSection}>
          {bottomSection ?? (
            <>
              <Button
                variant='primary'
                size='large'
                fullWidth
                title={messages.done}
                onPress={handleSubmit}
              />
              {onClear ? (
                <Button
                  variant='primary'
                  size='large'
                  fullWidth
                  title={messages.done}
                  onPress={onClear}
                />
              ) : null}
            </>
          )}
        </View>
      </ScreenContent>
    </Screen>
  )
}
