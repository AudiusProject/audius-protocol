import { useCallback } from 'react'

import { useLeavingAudiusModal } from '@audius/common/store'
import { isAllowedExternalLink } from '@audius/common/utils'
import type {
  GestureResponderEvent,
  TouchableWithoutFeedbackProps
} from 'react-native'
import { Linking, TouchableWithoutFeedback } from 'react-native'

import { useToast } from 'app/hooks/useToast'

const messages = {
  error: 'Unable to open this URL'
}

export type ExternalLinkProps = TouchableWithoutFeedbackProps & {
  url: string
}

export const ExternalLink = (props: ExternalLinkProps) => {
  const { url, children, onPress, ...other } = props
  const { toast } = useToast()
  const { onOpen: openLeavingAudiusModal } = useLeavingAudiusModal()

  const handlePress = useCallback(
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

  return (
    <TouchableWithoutFeedback onPress={handlePress} {...other}>
      {children}
    </TouchableWithoutFeedback>
  )
}
