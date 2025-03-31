import { useCallback } from 'react'

import { useNavigation } from '@react-navigation/native'
import { isEmpty } from 'lodash'

import { PlainButton } from '@audius/harmony-native'

import type { ScreenProps } from '../../components/core/Screen'
import { ScreenContent, Screen } from '../../components/core/Screen'

const messages = {
  cancel: 'Cancel',
  save: 'Save'
}

type FormScreenProps = ScreenProps & {
  onSubmit: () => void
  onReset: () => void
  errors?: Record<string, unknown>
}

export const FormScreen = (props: FormScreenProps) => {
  const { children, onSubmit, onReset, errors, ...other } = props

  const navigation = useNavigation()

  const handleCancel = useCallback(() => {
    onReset()
    navigation.goBack()
  }, [navigation, onReset])

  const topbarLeft = (
    <PlainButton onPress={handleCancel}>{messages.cancel}</PlainButton>
  )

  const topbarRight = (
    <PlainButton onPress={onSubmit} disabled={!isEmpty(errors)}>
      {messages.save}
    </PlainButton>
  )

  return (
    <Screen
      variant='white'
      topbarLeft={topbarLeft}
      topbarRight={topbarRight}
      {...other}
    >
      <ScreenContent>{children}</ScreenContent>
    </Screen>
  )
}
