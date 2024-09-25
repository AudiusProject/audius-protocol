import { useCallback } from 'react'

import { useLeavingAudiusModal } from '@audius/common/store'
import {
  getPathFromAudiusUrl,
  isAllowedExternalLink
} from '@audius/common/utils'
import { useLinkProps, useLinkTo } from '@react-navigation/native'
import type { GestureResponderEvent } from 'react-native'
import { Linking } from 'react-native'

import { useToast } from 'app/hooks/useToast'

import type { ExternalLinkProps, InternalLinkToProps } from './types'

const messages = {
  error: 'Unable to open this URL'
}

export const useHandlePressExternalUrl = (props: ExternalLinkProps) => {
  const { url, onPress } = props
  const { toast } = useToast()
  const { onOpen: openLeavingAudiusModal } = useLeavingAudiusModal()
  return useCallback(
    async (e: GestureResponderEvent) => {
      const errorToastConfig = {
        content: messages.error,
        type: 'error' as const
      }

      onPress?.(e)

      try {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          if (isAllowedExternalLink(url)) {
            await Linking.openURL(url)
          } else {
            openLeavingAudiusModal({ link: url })
          }
        } else {
          toast(errorToastConfig)
        }
      } catch (error) {
        toast(errorToastConfig)
      }
    },
    [onPress, openLeavingAudiusModal, toast, url]
  )
}

export const useHandlePressInternalUrl = (props: ExternalLinkProps) => {
  const { url, onPress } = props
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

type UseLinkPropsType<ParamList extends ReactNavigation.RootParamList> =
  Parameters<typeof useLinkProps<ParamList>>[0]

type UseHandlePressToProps<ParamList extends ReactNavigation.RootParamList> =
  InternalLinkToProps<ParamList> & UseLinkPropsType<ParamList>

export const useHandlePressTo = <
  ParamList extends ReactNavigation.RootParamList
>(
  props: UseHandlePressToProps<ParamList>
) => {
  const { onPress: onPressProp } = props

  const { onPress: onPressLink, ...linkProps } = useLinkProps(props)

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      onPressProp?.(e)
      onPressLink(e)
    },
    [onPressProp, onPressLink]
  )

  return { onPress, ...linkProps }
}
