import { Text, TextProps } from './Text'

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
