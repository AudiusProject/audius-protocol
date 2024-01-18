import type { GestureResponderEvent } from 'react-native'

import type { TextProps } from '../Text/Text'

import type { ExternalLinkProps } from './ExternalLink'
import type { InternalLinkProps } from './InternalLink'

type TextLinkTextProps = Omit<TextProps, 'variant' | 'color'>

type NonLinkProps = {
  onPress?: (e: GestureResponderEvent) => void
}

export type TextLinkProps<ParamList extends ReactNavigation.RootParamList> =
  TextLinkTextProps &
    (InternalLinkProps<ParamList> | ExternalLinkProps | NonLinkProps) & {
      /**
       * Which variant to display.
       * @default default
       */
      variant?: 'default' | 'subdued' | 'visible' | 'inverted'

      /**
       * Which text variant to display.
       */
      textVariant?: TextProps['variant']

      /**
       * When true, always show the link underline. This can help emphasize that
       * a text-link is present when next to other text.
       */
      showUnderline?: boolean
    }
