import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useGetUserByHandle } from '@audius/common/api'
import { accountSelectors } from '@audius/common/store'
import {
  formatCollectionName,
  formatTrackName,
  formatUserName,
  isAudiusUrl,
  restrictedHandles,
  squashNewLines
} from '@audius/common/utils'
import { ResolveApi } from '@audius/sdk'
import { css } from '@emotion/native'
import type { Match } from 'autolinker/dist/es2015'
import { View } from 'react-native'
import type { LayoutRectangle, Text as TextRef } from 'react-native'
import type { AutolinkProps } from 'react-native-autolink'
import Autolink from 'react-native-autolink'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import type { TextLinkProps, TextProps } from '@audius/harmony-native'
import { Text } from '@audius/harmony-native'
import { TextLink } from 'app/harmony-native/components/TextLink/TextLink'
import { audiusSdk } from 'app/services/sdk/audius-sdk'

const { getUserId } = accountSelectors

const {
  instanceOfTrackResponse,
  instanceOfUserResponse,
  instanceOfPlaylistResponse
} = ResolveApi

type PositionedLink = {
  text: string
  match: Match
}

export type UserGeneratedTextProps = Omit<TextProps, 'children'> &
  Pick<AutolinkProps, 'matchers'> & {
    children: string
    source?: 'profile page' | 'track page' | 'collection page'
    // Pass touches through text elements
    allowPointerEventsToPassThrough?: boolean
    linkProps?: Partial<TextLinkProps>

    // If true, only linkify Audius URLs
    internalLinksOnly?: boolean

    // Suffix to append after the text. Used for "edited" text in comments
    suffix?: ReactNode
  }

const Link = ({ children, url, ...other }: TextLinkProps & { url: string }) => {
  const [unfurledContent, setUnfurledContent] = useState<string>()
  const shouldUnfurl = isAudiusUrl(url)

  useAsync(async () => {
    if (shouldUnfurl && !unfurledContent) {
      const sdk = await audiusSdk()
      const res = await sdk.resolve({ url })
      if (res.data) {
        if (instanceOfTrackResponse(res)) {
          setUnfurledContent(formatTrackName({ track: res.data }))
        } else if (instanceOfPlaylistResponse(res)) {
          setUnfurledContent(formatCollectionName({ collection: res.data[0] }))
        } else if (instanceOfUserResponse(res)) {
          setUnfurledContent(formatUserName({ user: res.data }))
        }
      }
    }
  }, [url, shouldUnfurl, unfurledContent, setUnfurledContent])

  return (
    <TextLink {...other} url={url}>
      {unfurledContent ?? url}
    </TextLink>
  )
}

const HandleLink = ({
  handle,
  ...other
}: Omit<TextLinkProps, 'to'> & { handle: string }) => {
  const currentUserId = useSelector(getUserId)

  const { data: user } = useGetUserByHandle({
    handle: handle.replace('@', ''),
    currentUserId
  })

  return user ? (
    <TextLink
      {...other}
      to={{ screen: 'Profile', params: { id: user.user_id } }}
    >
      {handle}
    </TextLink>
  ) : (
    <Text {...other} variant={other.textVariant}>
      {handle}
    </Text>
  )
}

export const UserGeneratedText = (props: UserGeneratedTextProps) => {
  const {
    allowPointerEventsToPassThrough,
    source,
    style,
    children,
    linkProps,
    suffix,
    matchers,
    internalLinksOnly,
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
    (text: string, match: Match) => {
      const url = match.getAnchorHref()
      const shouldLinkify = !internalLinksOnly || isAudiusUrl(url)
      return shouldLinkify ? (
        <Link
          {...other}
          variant='visible'
          textVariant={other.variant}
          url={url}
          {...linkProps}
        />
      ) : (
        renderText(text)
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const renderHandleLink = useCallback((text: string) => {
    const isHandleUnrestricted = !restrictedHandles.has(text.toLowerCase())
    return isHandleUnrestricted ? (
      <HandleLink
        {...other}
        variant='visible'
        textVariant={other.variant}
        handle={text}
        {...linkProps}
      />
    ) : (
      renderText(text)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderText = useCallback(
    (text: string) => (
      <Text suppressHighlighting {...other}>
        {text}
      </Text>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <View>
      <View
        pointerEvents={allowPointerEventsToPassThrough ? 'none' : undefined}
        ref={linkContainerRef}
      >
        <Text>
          <Autolink
            renderLink={
              allowPointerEventsToPassThrough ? renderHiddenLink : renderLink
            }
            renderText={renderText}
            email
            url={false}
            style={[{ marginBottom: 3 }, style]}
            text={squashNewLines(children) as string}
            matchers={[
              // Handle matcher e.g. @handle
              {
                pattern: /@[a-zA-Z0-9_.]{1,15}/,
                renderLink: renderHandleLink
              },
              // URL match
              // Intentionally not using the default URL matcher to avoid conflict with the handle matcher. See: https://github.com/joshswan/react-native-autolink/issues/78
              {
                pattern:
                  /(https?:\/\/)?([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g
              },
              // custom matchers provided via props
              ...(matchers ?? [])
            ]}
          />
          {suffix}
        </Text>
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
