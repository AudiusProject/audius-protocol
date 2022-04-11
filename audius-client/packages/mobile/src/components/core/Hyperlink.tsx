import { ComponentProps, useCallback, useContext, useState } from 'react'

import { Match } from 'autolinker/dist/es2015'
import { LayoutRectangle, Linking, Text, View } from 'react-native'
import Autolink from 'react-native-autolink'

import { ToastContext } from 'app/components/toast/ToastContext'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { make, track } from 'app/utils/analytics'

const messages = {
  error: 'Unable to open this URL'
}

const useStyles = makeStyles(({ palette, typography }) => ({
  link: {
    color: palette.primary
  },
  linkText: {
    ...typography.body
  },
  linksContainer: {
    position: 'absolute'
  },
  hiddenLink: {
    marginBottom: -3,
    opacity: 0
  }
}))

type PositionedLink = {
  text: string
  match: Match
  layout: LayoutRectangle
}

export type HyperlinkProps = ComponentProps<typeof Autolink> & {
  source: 'profile page' | 'track page' | 'collection page'
  // Pass touches through text elements
  allowPointerEventsToPassThrough?: boolean
}

export const Hyperlink = (props: HyperlinkProps) => {
  const { allowPointerEventsToPassThrough, source, ...other } = props
  const styles = useStyles()
  const { toast } = useContext(ToastContext)

  const [links, setLinks] = useState<Record<number, PositionedLink>>({})

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

  const renderLink = useCallback(
    (text, match, index) => (
      <View
        onLayout={e => {
          setLinks({
            ...links,
            [index]: {
              text,
              match,
              layout: e.nativeEvent.layout
            }
          })
        }}
        style={styles.hiddenLink}
      >
        <Text style={styles.linkText}>{text}</Text>
      </View>
    ),
    [links, styles]
  )

  return (
    <>
      <View
        pointerEvents={allowPointerEventsToPassThrough ? 'none' : undefined}
      >
        <Autolink
          onPress={handlePress}
          linkStyle={[styles.linkText, styles.link]}
          renderLink={allowPointerEventsToPassThrough ? renderLink : undefined}
          email
          url
          {...other}
        />
      </View>

      <View style={styles.linksContainer}>
        {Object.values(links).map(({ layout, text, match }) => (
          <Text
            key={`${layout.x} ${layout.y}`}
            style={[
              styles.linkText,
              styles.link,
              { position: 'absolute', top: layout.y, left: layout.x }
            ]}
            onPress={() => handlePress(match.getAnchorHref())}
          >
            {text}
          </Text>
        ))}
      </View>
    </>
  )
}
