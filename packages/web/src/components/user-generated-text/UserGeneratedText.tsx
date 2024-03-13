import {
  forwardRef,
  useMemo,
  MouseEvent,
  Ref,
  ForwardedRef,
  ElementType
} from 'react'

import {
  squashNewLines,
  isAudiusUrl,
  getPathFromAudiusUrl
} from '@audius/common/utils'
import { Text, TextProps } from '@audius/harmony'
import Linkify from 'linkify-react'
import { IntermediateRepresentation, Opts } from 'linkifyjs'

import { ExternalLink, TextLink } from 'components/link'

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

  const LinkComponent = isExternalLink ? ExternalLink : TextLink

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
    variant = 'body',
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
      attributes: { source: linkSource, onClick: onClickLink }
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
      variant={variant}
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
