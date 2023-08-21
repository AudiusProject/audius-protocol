import { ReactNode } from 'react'

import { Maybe } from '@audius/common'
import {
  IconTwitterBird,
  IconInstagram,
  IconDonate,
  IconLink,
  IconTikTokInverted
} from '@audius/stems'
import cn from 'classnames'
import Linkify from 'linkify-react'

import { ExternalLink } from 'components/link'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './SocialLink.module.css'

export enum Type {
  TWITTER,
  INSTAGRAM,
  TIKTOK,
  WEBSITE,
  DONATION
}

const SITE_URL_MAP = {
  [Type.TWITTER]: 'https://twitter.com/',
  [Type.INSTAGRAM]: 'https://instagram.com/',
  [Type.TIKTOK]: 'https://tiktok.com/@'
}

type HandleType = keyof typeof SITE_URL_MAP

export const handleTypes = [Type.TWITTER, Type.INSTAGRAM, Type.TIKTOK]

const singleLinkTypes = [
  Type.TWITTER,
  Type.INSTAGRAM,
  Type.TIKTOK,
  Type.WEBSITE
]

const isHandleType = (type: Type): type is HandleType =>
  handleTypes.includes(type)

type SocialLinkProps = {
  type: Type
  link: string
  onClick: (event?: any) => void
  iconOnly?: boolean
}

const SocialLink = (props: SocialLinkProps) => {
  const { type, link, onClick, iconOnly = false } = props
  const isSingleLink = singleLinkTypes.includes(type)

  let icon: ReactNode
  switch (type) {
    case Type.TWITTER:
      icon = (
        <IconTwitterBird
          className={cn(styles.icon, { [styles.iconOnly]: iconOnly })}
        />
      )
      break
    case Type.INSTAGRAM:
      icon = (
        <IconInstagram
          className={cn(styles.icon, { [styles.iconOnly]: iconOnly })}
        />
      )
      break
    case Type.TIKTOK:
      icon = (
        <IconTikTokInverted
          className={cn(styles.icon, { [styles.iconOnly]: iconOnly })}
        />
      )
      break
    case Type.WEBSITE:
      icon = <IconLink className={styles.icon} />
      break
    case Type.DONATION:
      icon = (
        <Tooltip text='Donate'>
          <IconDonate className={styles.icon} />
        </Tooltip>
      )
      break
  }

  let text: ReactNode
  if (isHandleType(type)) {
    text = `@${link}`
  } else {
    text = link.replace(/((?:https?):\/\/)|www./g, '')
    if (type === Type.DONATION) {
      text = (
        <Linkify
          // https://github.com/Soapbox/linkifyjs/issues/292
          // @ts-ignore
          options={{
            attributes: { onClick },
            target: '_blank',
            rel: 'noreferrer'
          }}
        >
          {text}
        </Linkify>
      )
    }
  }

  let href: Maybe<string>

  if (isHandleType(type)) {
    href = `${SITE_URL_MAP[type]}${link}`
  } else if (isSingleLink) {
    if (!/^https?/.test(link)) {
      href = `https://${link}`
    } else {
      href = link
    }
  }

  const socialLinkContent = (
    <div
      className={cn(styles.wrapper, {
        [styles.singleLink]: isSingleLink
      })}
    >
      {icon}
      {!iconOnly && <div className={styles.text}>{text}</div>}
    </div>
  )

  const rootProps = {
    onClick,
    className: styles.socialLink
  }

  return href ? (
    <ExternalLink href={href} {...rootProps}>
      {socialLinkContent}
    </ExternalLink>
  ) : (
    <div {...rootProps}>{socialLinkContent}</div>
  )
}

export default SocialLink
