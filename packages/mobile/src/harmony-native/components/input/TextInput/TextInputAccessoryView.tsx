import { css } from '@emotion/native'
import { BlurView } from '@react-native-community/blur'
import type { InputAccessoryViewProps } from 'react-native'
import { InputAccessoryView, Keyboard, Platform } from 'react-native'

import { PlainButton, useTheme } from '@audius/harmony-native'

const messages = {
  done: 'Done'
}

export const TextInputAccessoryView = (props: InputAccessoryViewProps) => {
  const { type, spacing } = useTheme()

  if (Platform.OS !== 'ios') {
    // InputAccessoryView is only available on iOS
    return null
  }

  return (
    <InputAccessoryView {...props}>
      <BlurView
        blurType={type === 'day' ? 'thinMaterialLight' : 'thinMaterialDark'}
        blurAmount={20}
        style={css({ flexDirection: 'row', justifyContent: 'flex-end' })}
      >
        <PlainButton
          style={{
            marginRight: spacing.l,
            marginVertical: spacing.m
          }}
          onPress={Keyboard.dismiss}
        >
          {messages.done}
        </PlainButton>
      </BlurView>
    </InputAccessoryView>
  )
}
