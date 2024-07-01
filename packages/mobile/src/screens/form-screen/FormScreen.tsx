import { useCallback, type ReactNode } from 'react'

import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Flex, PlainButton } from '@audius/harmony-native'
import type { ScreenProps } from 'app/components/core'
import { Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  done: 'Done',
  clear: 'Clear'
}

export type FormScreenProps = ScreenProps & {
  bottomSection?: ReactNode
  onSubmit?: () => void
  onClear?: () => void
  clearable?: boolean
}

export const FormScreen = (props: FormScreenProps) => {
  const {
    children,
    style,
    bottomSection,
    onClear,
    clearable,
    onSubmit,
    ...other
  } = props
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const handleSubmit = useCallback(() => {
    navigation.goBack()
    onSubmit?.()
  }, [navigation, onSubmit])

  return (
    <Screen
      variant='secondary'
      style={[{ justifyContent: 'space-between' }, style]}
      {...other}
    >
      {children}
      <Flex
        p='l'
        pb={insets.bottom}
        backgroundColor='white'
        borderTop='default'
        gap='m'
      >
        {bottomSection ?? (
          <>
            <Button variant='primary' fullWidth onPress={handleSubmit}>
              {messages.done}
            </Button>
            {onClear ? (
              <PlainButton size='large' disabled={!clearable} onPress={onClear}>
                {messages.clear}
              </PlainButton>
            ) : null}
          </>
        )}
      </Flex>
    </Screen>
  )
}
