import { css } from '@emotion/native'
import { BlurView } from '@react-native-community/blur'
import type { InputAccessoryViewProps } from 'react-native'
import { InputAccessoryView, Keyboard } from 'react-native'

import { useTheme } from '@audius/harmony-native'
import { TextButton } from 'app/components/core'

const messages = {
  done: 'Done'
}

export const TextInputAccessoryView = (props: InputAccessoryViewProps) => {
  const { type, spacing } = useTheme()

  return (
    <InputAccessoryView {...props}>
      <BlurView
        blurType={type === 'day' ? 'thinMaterialLight' : 'thinMaterialDark'}
        blurAmount={20}
        style={css({ flexDirection: 'row', justifyContent: 'flex-end' })}
      >
        {/* TODO migrate to plain-button */}
        <TextButton
          variant='secondary'
          title={messages.done}
          TextProps={{ fontSize: 'large', weight: 'demiBold' }}
          style={{
            marginRight: spacing.l,
            marginVertical: spacing.m
          }}
          onPress={Keyboard.dismiss}
        />
      </BlurView>
    </InputAccessoryView>
  )
}
