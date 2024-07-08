import {
  forwardRef,
  useMemo,
  MouseEvent,
  Ref,
  ForwardedRef,
  ElementType
} from 'react'

import { Text, TextProps } from '@audius/harmony'
import Linkify from 'linkify-react'
import { IntermediateRepresentation, Opts } from 'linkifyjs'

import { ExternalTextLink } from 'components/link/ExternalTextLink'
import { TextLink } from 'components/link/TextLink'
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

const renderLink = ({ attributes, content }: IntermediateRepresentation) => {
  const { href, ...props } = attributes

  const isExternalLink = !isAudiusUrl(href)
  const to = isExternalLink ? formatExternalLink(href) : formatAudiusUrl(href)

  const LinkComponent = isExternalLink ? ExternalTextLink : TextLink

  return (
    <LinkComponent to={to} variant='visible' {...props}>
      {content}
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
      render: renderLink,
      attributes: {
        source: linkSource,
        onClick: onClickLink,
        textVariant: variant,
        size,
        strength
      }
    }),
    [linkSource, onClickLink]
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
