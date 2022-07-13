import { ComponentProps, useCallback, useEffect, useRef, useState } from 'react'

import { Match } from 'autolinker/dist/es2015'
import { LayoutRectangle, Text, TextStyle, View } from 'react-native'
import Autolink from 'react-native-autolink'

import { makeStyles, StylesProp } from 'app/styles'

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
  source: 'profile page' | 'track page' | 'collection page'
  // Pass touches through text elements
  allowPointerEventsToPassThrough?: boolean
  styles?: StylesProp<{ root: TextStyle; link: TextStyle }>
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

  const linkContainerRef = useRef<View>(null)
  const linkRefs = useRef<Record<number, Text>>({})
  const [links, setLinks] = useState<Record<number, PositionedLink>>({})
  const [linkLayouts, setLinkLayouts] = useState<
    Record<number, LayoutRectangle>
  >({})
  const [linkContainerLayout, setLinkContainerLayout] =
    useState<LayoutRectangle>()

  /**
   * Need to use `measureInWindow` instead of `onLayout` or `measure` because
   * android doesn't return the correct layout for nested text elements
   * */
  useEffect(() => {
    Object.entries(linkRefs.current).forEach(([index, ref]) => {
      ref.measureInWindow((x, y, width, height) => {
        setLinkLayouts((linkLayouts) => ({
          ...linkLayouts,
          [index]: { x, y, width, height }
        }))
      })
    })

    if (linkContainerRef.current) {
      linkContainerRef.current.measureInWindow((x, y, width, height) =>
        setLinkContainerLayout({ x, y, width, height })
      )
    }
  }, [linkRefs, linkContainerRef])

  const handlePress = useOnOpenLink(source)

  const renderLink = useCallback(
    (text, match, index) => (
      <View
        onLayout={(e) => {
          setLinks({
            ...links,
            [index]: {
              text,
              match
            }
          })
        }}
        ref={(el) => {
          if (linkRefs.current && el) {
            linkRefs.current[index] = el
          }
        }}
        style={styles.hiddenLink}>
        <Text style={[styles.linkText, styles.hiddenLinkText]}>{text}</Text>
      </View>
    ),
    [links, styles]
  )

  return (
    <>
      <View
        pointerEvents={allowPointerEventsToPassThrough ? 'none' : undefined}
        ref={linkContainerRef}>
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
              onPress={() => handlePress(match.getAnchorHref())}>
              {text}
            </Text>
          ) : null
        })}
      </View>
    </>
  )
}
