import {
  forwardRef,
  useMemo,
  MouseEvent,
  Ref,
  ForwardedRef,
  ElementType,
  useEffect,
  useState
} from 'react'

import { formatTrackName } from '@audius/common/utils'
import { Text, TextProps } from '@audius/harmony'
import Linkify from 'linkify-react'
import { IntermediateRepresentation, Opts } from 'linkifyjs'

import { ExternalTextLink } from 'components/link/ExternalTextLink'
import { TextLink } from 'components/link/TextLink'
import { audiusSdk } from 'services/audius-sdk'
import { squashNewLines } from 'utils/stringUtils'
import { getPathFromAudiusUrl, isAudiusUrl } from 'utils/urlUtils'

type LinkifyTextProps = TextProps<any> & {
  innerRef?: Ref<any>
}

const LinkifyText = forwardRef((props: LinkifyTextProps, ref) => {
  const { innerRef, ...other } = props
  return <Text ref={innerRef ?? ref} {...other} />
})

type UserGeneratedTextProps<T extends ElementType> = TextProps<T> & {
  linkSource?: 'profile page' | 'track page' | 'collection page'
  onClickLink?: (event: MouseEvent<HTMLAnchorElement>) => void
}

const formatExternalLink = (href: string) => {
  const strippedHref = href.replace(/((?:https?):\/\/)|www./g, '')
  return `https://${strippedHref}`
}

const formatAudiusUrl = (href: string) => {
  return getPathFromAudiusUrl(href) as string
}

const RenderLink = ({ attributes, content }: IntermediateRepresentation) => {
  const { href, ...props } = attributes
  const [unfurledContent, setUnfurledContent] = useState<string>()

  useEffect(() => {
    if (isAudiusUrl(href) && !unfurledContent) {
      const fn = async () => {
        const sdk = await audiusSdk()
        const { data } = await sdk.resolve({ url: href })
        if (data && 'title' in data) {
          setUnfurledContent(formatTrackName({ track: data }))
        }
      }
      fn()
    }
  }, [href, unfurledContent, setUnfurledContent])

  const isExternalLink = !isAudiusUrl(href)
  const to = isExternalLink ? formatExternalLink(href) : formatAudiusUrl(href)

  const LinkComponent = isExternalLink ? ExternalTextLink : TextLink

  return (
    <LinkComponent to={to} variant='visible' {...props}>
      {unfurledContent ?? content}
    </LinkComponent>
  )
}

export const UserGeneratedText = forwardRef(function <T extends ElementType>(
  props: UserGeneratedTextProps<T>,
  ref: ForwardedRef<HTMLElement>
) {
  const {
    children: childrenProp,
    variant,
    color,
    size,
    strength,
    tag = 'p',
    linkSource,
    onClickLink,
    ...other
  } = props

  const options: Opts = useMemo(
    () => ({
      render: RenderLink,
      attributes: {
        source: linkSource,
        onClick: onClickLink,
        textVariant: variant,
        size,
        strength
      }
    }),
    [linkSource, onClickLink, variant, size, strength]
  )

  const children =
    typeof childrenProp === 'string'
      ? squashNewLines(childrenProp)
      : childrenProp

  return (
    <Linkify
      options={options}
      as={LinkifyText}
      innerRef={ref}
      tag={tag}
      color={color}
      size={size}
      strength={strength}
      css={{ whiteSpace: 'pre-line' }}
      {...other}
    >
      {children}
    </Linkify>
  )
})
