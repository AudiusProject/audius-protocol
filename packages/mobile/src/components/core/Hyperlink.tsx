import { ComponentProps, ReactNode, useCallback, useContext } from 'react'

import { Linking } from 'react-native'
import RNHyperlink from 'react-native-hyperlink'

import { ToastContext } from 'app/components/toast/ToastContext'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { make, track } from 'app/utils/analytics'

const messages = {
  error: 'Unable to open this URL'
}

const useStyles = makeStyles(({ palette }) => ({
  link: {
    color: palette.primary
  }
}))

export type HyperlinkProps = ComponentProps<typeof RNHyperlink> & {
  children: ReactNode
  source: 'profile page' | 'track page' | 'collection page'
}

export const Hyperlink = (props: HyperlinkProps) => {
  const { children, source, ...other } = props
  const styles = useStyles()
  const { toast } = useContext(ToastContext)

  const handlePress = useCallback(
    async (url: string) => {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        Linking.openURL(url)
        track(make({ eventName: EventNames.LINK_CLICKING, url, source }))
      } else {
        toast({ content: messages.error, type: 'error' })
      }
    },
    [source, toast]
  )

  return (
    <RNHyperlink onPress={handlePress} linkStyle={styles.link} {...other}>
      {children}
    </RNHyperlink>
  )
}
