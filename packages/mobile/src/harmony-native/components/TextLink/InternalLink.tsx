import type { ReactNode } from 'react'
import { useCallback } from 'react'

import { getPathFromAudiusUrl } from '@audius/common/utils'
import type { NavigationAction } from '@react-navigation/native'
import { useLinkProps, useLinkTo } from '@react-navigation/native'
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo'
import type { GestureResponderEvent } from 'react-native'

import type { GestureResponderHandler } from 'app/types/gesture'

import { TextPressable } from './TextPressable'

export type InternalLinkToProps<
  ParamList extends ReactNavigation.RootParamList
> = {
  to: To<ParamList>
  action?: NavigationAction
  target?: string
  onPress?: (e: GestureResponderEvent) => void
  children?: ReactNode
}

export const InternalLinkTo = <ParamList extends ReactNavigation.RootParamList>(
  props: InternalLinkToProps<ParamList>
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
    <TextPressable onPress={handlePress} {...other} {...linkProps}>
      {children}
    </TextPressable>
  )
}

type InternalLinkProps = {
  url: string
  onPress?: (e: GestureResponderEvent) => void
  children?: ReactNode
}

export const useInternalLinkHandlePress = ({
  url,
  onPress
}: {
  url: string
  onPress?: GestureResponderHandler
}) => {
  const linkTo = useLinkTo()

  return useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      const internalLink = getPathFromAudiusUrl(url)
      if (internalLink) {
        linkTo(internalLink)
      }
    },
    [onPress, url, linkTo]
  )
}

export const InternalLink = (props: InternalLinkProps) => {
  const { url, onPress, children, ...other } = props
  const handlePress = useInternalLinkHandlePress({ url, onPress })
  return (
    <TextPressable onPress={handlePress} accessibilityRole='link' {...other}>
      {children}
    </TextPressable>
  )
}
