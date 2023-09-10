import type { TextProps } from './Text'
import { Text } from './Text'

const messages = {
  audio: 'audio tokens'
}

type AudioProps = TextProps

export const AudioText = (props: AudioProps) => {
  return (
    <Text accessibilityLabel={messages.audio} {...props}>
      $AUDIO
    </Text>
  )
}
