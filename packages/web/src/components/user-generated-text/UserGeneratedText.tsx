import { forwardRef, useMemo, MouseEvent } from 'react'

import {
  squashNewLines,
  isAudiusUrl,
  getPathFromAudiusUrl
} from '@audius/common/utils'
import cn from 'classnames'
import Linkify from 'linkify-react'
import { IntermediateRepresentation, Opts } from 'linkifyjs'

import { ExternalLink, Link } from 'components/link'
import { Text } from 'components/typography'
import { TextProps } from 'components/typography/Text'

import styles from './UserGeneratedText.module.css'

type UserGeneratedTextProps = TextProps & {
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

  const LinkComponent = isExternalLink ? ExternalLink : Link

  return (
    <LinkComponent to={to} variant='inherit' color='primary' {...props}>
      {content}
    </LinkComponent>
  )
}

export const UserGeneratedText = forwardRef(function (
  props: UserGeneratedTextProps,
  ref
) {
  const {
    children: childrenProp,
    variant,
    color,
    size,
    strength,
    component,
    className,
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
      // @ts-expect-error
      as={Text}
      innerRef={ref}
      component={component}
      variant={variant}
      color={color}
      size={size}
      strength={strength}
      className={cn(styles.root, className)}
      {...other}
    >
      {children}
    </Linkify>
  )
})
