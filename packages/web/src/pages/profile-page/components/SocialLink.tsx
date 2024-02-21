import { ReactNode } from 'react'

import {
  IconLink,
  IconTikTok,
  IconTwitter as IconTwitterBird,
  IconInstagram,
  IconDonate,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import { Icon } from 'components/Icon'
import { ExternalLink } from 'components/link'
import Tooltip from 'components/tooltip/Tooltip'
import { UserGeneratedText } from 'components/user-generated-text'

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

const socialIcons = {
  [Type.TWITTER]: IconTwitterBird,
  [Type.INSTAGRAM]: IconInstagram,
  [Type.TIKTOK]: IconTikTok,
  [Type.WEBSITE]: IconLink,
  [Type.DONATION]: IconDonate
}

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

  const SocialIcon = socialIcons[type]

  let icon = (
    <Icon
      icon={SocialIcon}
      size={iconOnly ? 'large' : 'medium'}
      className={isSingleLink ? styles.icon : undefined}
    />
  )
  if (type === Type.DONATION) {
    icon = <Tooltip text='Donate'>{icon}</Tooltip>
  }

  let text: ReactNode
  if (isHandleType(type)) {
    text = `@${link}`
  } else {
    text = link.replace(/((?:https?):\/\/)|www./g, '')
    if (type === Type.DONATION) {
      text = <UserGeneratedText size='small'>{text}</UserGeneratedText>
    }
  }

  let href = ''

  if (isHandleType(type)) {
    href = `${SITE_URL_MAP[type]}${link}`
  } else if (isSingleLink) {
    if (!/^https?/.test(link)) {
      href = `https://${link}`
    } else {
      href = link
    }
  }

  const Root = href ? ExternalLink : Text

  return (
    <Root to={href} onClick={onClick} size='s' className={styles.root}>
      {icon}
      {iconOnly ? null : (
        <Text
          variant='inherit'
          id='hello'
          className={cn(styles.text, isSingleLink && styles.singleLink)}
        >
          {text}
        </Text>
      )}
    </Root>
  )
}

export default SocialLink
