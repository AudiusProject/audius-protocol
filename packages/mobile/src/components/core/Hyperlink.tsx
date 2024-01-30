import type { ComponentProps } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useLeavingAudiusModal } from '@audius/common'
import {
  isInteralAudiusUrl,
  getPathFromAudiusUrl,
  isAllowedExternalLink
} from '@audius/common/utils'
import { useLinkTo } from '@react-navigation/native'
import type { Match } from 'autolinker/dist/es2015'
import type { LayoutRectangle, TextStyle } from 'react-native'
import { Text, View } from 'react-native'
import Autolink from 'react-native-autolink'

import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'

import { useOnOpenLink } from './Link'

const useStyles = makeStyles(({ palette, typography }) => ({
  root: {
    marginBottom: 3
  },
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
    opacity: 0
  },
  hiddenLinkText: {
    marginTop: -3
  }
}))

type PositionedLink = {
  text: string
  match: Match
}

export type HyperlinkProps = ComponentProps<typeof Autolink> & {
  source?: 'profile page' | 'track page' | 'collection page'
  // Pass touches through text elements
  allowPointerEventsToPassThrough?: boolean
  styles?: StylesProp<{ root: TextStyle; link: TextStyle }>
  warnExternal?: boolean
}

export const Hyperlink = (props: HyperlinkProps) => {
  const {
    allowPointerEventsToPassThrough,
    source,
    styles: stylesProp,
    style,
    ...other
  } = props
  const styles = useStyles()
  const linkTo = useLinkTo()

  const linkContainerRef = useRef<View>(null)
  const [linkRefs, setLinkRefs] = useState<Record<number, Text>>({})
  const [links, setLinks] = useState<Record<number, PositionedLink>>({})
  const [linkLayouts, setLinkLayouts] = useState<
    Record<number, LayoutRectangle>
  >({})
  const [linkContainerLayout, setLinkContainerLayout] =
    useState<LayoutRectangle>()

  useEffect(() => {
    let layouts = {}
    const linkKeys = Object.keys(links)

    // Measure the layout of each link
    linkKeys.forEach((key) => {
      const linkRef = linkRefs[key]
      if (linkRef) {
        // Need to use `measureInWindow` instead of `onLayout` or `measure` because
        // android doesn't return the correct layout for nested text elements
        linkRef.measureInWindow((x, y, width, height) => {
          layouts = { ...layouts, [key]: { x, y, width, height } }

          // If all the links have been measured, update state
          if (linkKeys.length === Object.keys(layouts).length) {
            setLinkLayouts(layouts)
          }
        })
      }
    })

    if (linkContainerRef.current) {
      linkContainerRef.current.measureInWindow((x, y, width, height) =>
        setLinkContainerLayout({ x, y, width, height })
      )
    }
  }, [links, linkRefs, linkContainerRef])

  const openLink = useOnOpenLink(source)
  const { onOpen: openLeavingAudiusModal } = useLeavingAudiusModal()

  const handlePress = useCallback(
    (url: string) => {
      if (isInteralAudiusUrl(url)) {
        const path = getPathFromAudiusUrl(url)
        if (path) {
          linkTo(path)
        }
      } else if (isAllowedExternalLink(url)) {
        openLink(url)
      } else {
        openLeavingAudiusModal({ link: url })
      }
    },
    [linkTo, openLink, openLeavingAudiusModal]
  )

  const renderLink = useCallback(
    (text, match, index) => (
      <View
        onLayout={(e) => {
          setLinks((links) => ({
            ...links,
            [index]: {
              text,
              match
            }
          }))
        }}
        ref={(el) => {
          if (el) {
            setLinkRefs((linkRefs) => {
              if (linkRefs[index]) {
                return linkRefs
              }
              return { ...linkRefs, [index]: el }
            })
          }
        }}
        style={styles.hiddenLink}
      >
        <Text style={[styles.linkText, styles.hiddenLinkText]}>{text}</Text>
      </View>
    ),
    [styles]
  )

  return (
    <>
      <View
        pointerEvents={allowPointerEventsToPassThrough ? 'none' : undefined}
        ref={linkContainerRef}
      >
        <Autolink
          onPress={handlePress}
          linkStyle={[styles.linkText, styles.link, stylesProp?.link]}
          renderLink={allowPointerEventsToPassThrough ? renderLink : undefined}
          email
          url
          style={[styles.root, style, stylesProp?.root]}
          {...other}
        />
      </View>

      <View style={styles.linksContainer}>
        {Object.entries(links).map(([index, { text, match }]) => {
          const linkLayout = linkLayouts[index]

          return linkLayout && linkContainerLayout ? (
            <Text
              key={`${linkLayout.x} ${linkLayout.y} ${index}`}
              style={[
                styles.linkText,
                styles.link,
                {
                  position: 'absolute',
                  top: linkLayout.y - linkContainerLayout.y,
                  left: linkLayout.x - linkContainerLayout.x
                }
              ]}
              onPress={() => handlePress(match.getAnchorHref())}
            >
              {text}
            </Text>
          ) : null
        })}
      </View>
    </>
  )
}
