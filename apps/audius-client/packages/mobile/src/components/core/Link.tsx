import { useCallback, useContext } from 'react'

import {
  GestureResponderEvent,
  Linking,
  Pressable,
  PressableProps
} from 'react-native'

import { ToastContext } from 'app/components/toast/ToastContext'
import { EventNames } from 'app/types/analytics'
import { make, track } from 'app/utils/analytics'

const messages = {
  error: 'Unable to open this URL'
}

export const useOnPressLink = (
  source?: 'profile page' | 'track page' | 'collection page'
) => {
  const { toast } = useContext(ToastContext)

  const handlePress = useCallback(
    async (url: string) => {
      const errorToastConfig = {
        content: messages.error,
        type: 'error' as const
      }

      try {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          await Linking.openURL(url)
          if (source) {
            track(make({ eventName: EventNames.LINK_CLICKING, url, source }))
          }
        } else {
          toast(errorToastConfig)
        }
      } catch (error) {
        toast(errorToastConfig)
      }
    },
    [toast, source]
  )

  return handlePress
}

export const useLink = (url: string) => {
  const onPressLink = useOnPressLink()

  const handlePress = useCallback(() => {
    return onPressLink(url)
  }, [url, onPressLink])

  return { onPress: handlePress }
}

type LinkProps = PressableProps & {
  url: string
}

export const Link = (props: LinkProps) => {
  const { url, onPress, ...other } = props
  const { onPress: onPressLink } = useLink(url)

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      onPress?.(event)
      onPressLink()
    },
    [onPress, onPressLink]
  )

  return <Pressable onPress={handlePress} {...other} />
}
