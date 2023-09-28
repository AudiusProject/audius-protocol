import type { NavigationAction } from '@react-navigation/native'
import { Link as NavigationLink } from '@react-navigation/native'
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo'
import type { GestureResponderEvent } from 'react-native'

import { Text } from 'app/components/core'

type LinkProps<ParamList extends ReactNavigation.RootParamList> = {
  to: To<ParamList>
  action?: NavigationAction
  target?: string
  onPress?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => void
}

export const Link = <ParamList extends ReactNavigation.RootParamList>(
  props: LinkProps<ParamList>
) => {
  const { to, action, target, onPress, ...textProps } = props
  return (
    <NavigationLink to={to} action={action} target={target} onPress={onPress}>
      <Text {...textProps} />
    </NavigationLink>
  )
}
