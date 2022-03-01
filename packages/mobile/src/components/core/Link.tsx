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

  const handlePress = useCallback(
    async (event?: GestureResponderEvent) => {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        toast({ content: messages.error, type: 'error' })
      }
    },
    [url, toast]
  )

  return { onPress: handlePress }
}

type LinkProps = PressableProps & {
  url: string
}

export const Link = (props: LinkProps) => {
  const { url, onPress, ...other } = props
  const { toast } = useContext(ToastContext)

  const handlePress = useCallback(
    async (event: GestureResponderEvent) => {
      onPress?.(event)
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        toast({ content: messages.error, type: 'error' })
      }
    },
    [url, onPress, toast]
  )

  return <Pressable onPress={handlePress} {...other} />
}
