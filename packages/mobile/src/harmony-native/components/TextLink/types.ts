import type { ReactNode } from 'react'

import type { ParamListBase } from '@react-navigation/native'
import type { GestureResponderEvent } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

import type { TextProps } from '../Text/Text'

import type { ExternalLinkProps } from './ExternalLink'
import type { InternalLinkToProps } from './InternalLink'

export type Source = 'profile page' | 'track page' | 'collection page'

type TextLinkTextProps = Omit<TextProps, 'variant' | 'color'>

type NonLinkProps = {
  onPress?: (e: GestureResponderEvent) => void
}

export type TextLinkAnimationProps = TextLinkTextProps & {
  /**
   * Which variant to display. 'active' is temporary intil this pattern is removed
   */
  variant?: 'default' | 'subdued' | 'visible' | 'inverted' | 'active'

  /**
   * Which text variant to display.
   */
  textVariant?: TextProps['variant']

  /**
   * When true, always show the link underline. This can help emphasize that
   * a text-link is present when next to other text.
   */
  showUnderline?: boolean

  /**
   * SharedValue that represents the pressed state.
   */
  animatedPressed: SharedValue<number>
}

export type TextLinkProps<
  ParamList extends ReactNavigation.RootParamList = ParamListBase
> = (InternalLinkToProps<ParamList> | ExternalLinkProps | NonLinkProps) &
  Omit<TextLinkAnimationProps, 'animatedPressed'> & {
    source?: Source

    /**
     * React element to the right side of the text link.
     */
    endAdornment?: ReactNode
  }

export type TextLinkFlowingProps<
  ParamList extends ReactNavigation.RootParamList = ParamListBase
> = (InternalLinkToProps<ParamList> | ExternalLinkProps | NonLinkProps) &
  Omit<TextLinkAnimationProps, 'animatedPressed'> & {
    source?: Source
  }
