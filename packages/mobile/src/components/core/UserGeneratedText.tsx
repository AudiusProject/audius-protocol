import { useCallback, useEffect, useRef, useState } from 'react'

import {
  formatCollectionName,
  formatTrackName,
  formatUserName,
  isAudiusUrl,
  squashNewLines
} from '@audius/common/utils'
import { ResolveApi } from '@audius/sdk'
import { css } from '@emotion/native'
import type { Match } from 'autolinker/dist/es2015'
import { View } from 'react-native'
import type { LayoutRectangle, Text as TextRef } from 'react-native'
import Autolink from 'react-native-autolink'

import type { TextLinkProps, TextProps } from '@audius/harmony-native'
import { Text, TextLink } from '@audius/harmony-native'
import { audiusSdk } from 'app/services/sdk/audius-sdk'

const {
  instanceOfTrackResponse,
  instanceOfUserResponse,
  instanceOfPlaylistResponse
} = ResolveApi

type PositionedLink = {
  text: string
  match: Match
}

export type UserGeneratedTextProps = Omit<TextProps, 'children'> & {
  children: string
  source?: 'profile page' | 'track page' | 'collection page'
  // Pass touches through text elements
  allowPointerEventsToPassThrough?: boolean
  linkProps?: Partial<TextLinkProps>
}

const Link = ({ children, url, ...other }: TextLinkProps & { url: string }) => {
  const [unfurledContent, setUnfurledContent] = useState<string>()

  useEffect(() => {
    if (isAudiusUrl(url) && !unfurledContent) {
      const fn = async () => {
        const sdk = await audiusSdk()
        const res = await sdk.resolve({ url })
        if (res.data) {
          if (instanceOfTrackResponse(res)) {
            setUnfurledContent(formatTrackName({ track: res.data }))
          } else if (instanceOfPlaylistResponse(res)) {
            setUnfurledContent(
              formatCollectionName({ collection: res.data[0] })
            )
          } else if (instanceOfUserResponse(res)) {
            setUnfurledContent(formatUserName({ user: res.data }))
          }
        }
      }
      fn()
    }
  }, [url, unfurledContent, setUnfurledContent])

  return (
    <TextLink {...other} url={url}>
      {unfurledContent ?? children}
    </TextLink>
  )
}

export const UserGeneratedText = (props: UserGeneratedTextProps) => {
  const {
    allowPointerEventsToPassThrough,
    source,
    style,
    children,
    linkProps,
    ...other
  } = props

  const linkContainerRef = useRef<View>(null)
  const [linkRefs, setLinkRefs] = useState<Record<number, TextRef>>({})
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

  // We let Autolink lay out each link invisibly, and capture their position and data
  const renderHiddenLink = useCallback(
    (text: string, match: Match, index: number) => (
      <View
        onLayout={() => {
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
        // Negative margin needed to handle View overflow
        style={css({ opacity: 0, marginTop: -3 })}
      >
        <Text {...other}>{text}</Text>
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const renderLink = useCallback(
    (text: string, match: Match) => (
      <Link
        {...other}
        variant='visible'
        textVariant={other.variant}
        url={match.getAnchorHref()}
        {...linkProps}
      >
        {text}
      </Link>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const renderText = useCallback(
    (text: string) => <Text {...other}>{text}</Text>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <View>
      <View
        pointerEvents={allowPointerEventsToPassThrough ? 'none' : undefined}
        ref={linkContainerRef}
      >
        <Autolink
          renderLink={
            allowPointerEventsToPassThrough ? renderHiddenLink : renderLink
          }
          renderText={renderText}
          email
          url
          style={[{ marginBottom: 3 }, style]}
          text={squashNewLines(children) as string}
        />
      </View>
      {/* We overlay copies of each link on top of the invisible links */}
      <View style={{ position: 'absolute' }}>
        {Object.entries(links).map(([index, { text, match }]) => {
          const linkLayout = linkLayouts[index]

          return linkLayout && linkContainerLayout ? (
            <Link
              {...other}
              variant='visible'
              textVariant={other.variant}
              key={`${linkLayout.x} ${linkLayout.y} ${index}`}
              style={{
                position: 'absolute',
                top: linkLayout.y - linkContainerLayout.y,
                left: linkLayout.x - linkContainerLayout.x
              }}
              url={match.getAnchorHref()}
              source={source}
              {...linkProps}
            >
              {text}
            </Link>
          ) : null
        })}
      </View>
    </View>
  )
}
