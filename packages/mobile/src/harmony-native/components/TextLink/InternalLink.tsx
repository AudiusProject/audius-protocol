import type { ReactNode } from 'react'
import { useCallback } from 'react'

import type { NavigationAction } from '@react-navigation/native'
import { useLinkProps } from '@react-navigation/native'
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo'
import type { GestureResponderEvent } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native'

export type InternalLinkProps<ParamList extends ReactNavigation.RootParamList> =
  {
    to: To<ParamList>
    action?: NavigationAction
    target?: string
    onPress?: (e: GestureResponderEvent) => void
    children?: ReactNode
  }

export const InternalLink = <ParamList extends ReactNavigation.RootParamList>(
  props: InternalLinkProps<ParamList>
) => {
  const { to, action, onPress, children, ...other } = props
  const { onPress: onPressLink, ...linkProps } = useLinkProps({ to, action })

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      onPressLink(e)
    },
    [onPress, onPressLink]
  )

  return (
    <TouchableWithoutFeedback onPress={handlePress} {...other} {...linkProps}>
      {children}
    </TouchableWithoutFeedback>
  )
}
