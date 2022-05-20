import { useCallback, useContext } from 'react'

import {
  GestureResponderEvent,
  Linking,
  Pressable,
  PressableProps
} from 'react-native'

import { ToastContext } from 'app/components/toast/ToastContext'

const messages = {
  error: 'Unable to open this URL'
}

export const useLink = (url: string) => {
  const { toast } = useContext(ToastContext)

  const handlePress = useCallback(async () => {
    const errorToastConfig = { content: messages.error, type: 'error' as const }
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        toast(errorToastConfig)
      }
    } catch (error) {
      toast(errorToastConfig)
    }
  }, [url, toast])

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
