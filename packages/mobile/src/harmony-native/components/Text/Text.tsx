import type { TextProps as TextPropsBase } from 'react-native'
import { Text as TextBase } from 'react-native'

type TextProps = TextPropsBase

export const Text = (props: TextProps) => {
  return <TextBase {...props} />
}
