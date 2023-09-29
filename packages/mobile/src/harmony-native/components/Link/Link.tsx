import type { NavigationAction } from '@react-navigation/native'
import { Link as NavigationLink } from '@react-navigation/native'
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo'
import type { GestureResponderEvent } from 'react-native'

import type { TextProps } from 'app/components/core'
import { Text } from 'app/components/core'
import type { AppTabScreenParamList } from 'app/screens/app-screen'

type LinkProps<ParamList extends ReactNavigation.RootParamList> = {
  to: To<ParamList>
  action?: NavigationAction
  target?: string
  onPress?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => void
} & TextProps

export const Link = <
  ParamList extends ReactNavigation.RootParamList = AppTabScreenParamList
>(
  props: LinkProps<ParamList>
) => {
  const { to, action, target, onPress, ...textProps } = props
  return (
    <NavigationLink
      to={to}
      action={action}
      target={target}
      onPress={onPress}
      role='link'
    >
      <Text {...textProps} />
    </NavigationLink>
  )
}
