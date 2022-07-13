import { ReactNode, useCallback, useMemo } from 'react'

import {
  IconTwitterBird,
  IconInstagram,
  IconDonate,
  IconLink,
  IconTikTokInverted
} from '@audius/stems'
import cn from 'classnames'
import Linkify from 'linkifyjs/react'

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

const goToHandle = (type: HandleType, handle: string) => {
  if (SITE_URL_MAP[type] && handle) {
    const win = window.open(`${SITE_URL_MAP[type]}${handle}`, '_blank')
    if (win) win.focus()
  }
}

const goToLink = (link: string) => {
  if (!/^https?/.test(link)) {
    link = `http://${link}`
  }
  const win = window.open(link, '_blank')
  if (win) win.focus()
}

export const handleTypes = [Type.TWITTER, Type.INSTAGRAM, Type.TIKTOK]
const singleLinkTypes = [
  Type.TWITTER,
  Type.INSTAGRAM,
  Type.TIKTOK,
  Type.WEBSITE
]

type SocialLinkProps = {
  type: Type
  link: string
  onClick: (event?: any) => void
  iconOnly?: boolean
}

const SocialLink = ({
  type,
  link,
  onClick,
  iconOnly = false
}: SocialLinkProps) => {
  const isHandle = useMemo(() => handleTypes.includes(type), [type])
  const isSingleLink = useMemo(() => singleLinkTypes.includes(type), [type])

  const onIconClick = useCallback(() => {
    if (isHandle) {
      goToHandle(type as HandleType, link)
    } else {
      goToLink(link)
    }
    if (onClick) onClick()
  }, [isHandle, type, link, onClick])

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
  if (isHandle) {
    text = `@${link}`
  } else {
    text = link.replace(/((?:https?):\/\/)|www./g, '')
    if (type === Type.DONATION) {
      text = (
        <Linkify
          // https://github.com/Soapbox/linkifyjs/issues/292
          // @ts-ignore
          options={{ attributes: { onClick } }}>
          {text}
        </Linkify>
      )
    }
  }

  return (
    <div className={styles.socialLink}>
      <div
        onClick={isSingleLink ? onIconClick : () => {}}
        className={cn(styles.wrapper, {
          [styles.singleLink]: isSingleLink
        })}>
        {icon}
        {!iconOnly && <div className={styles.text}>{text}</div>}
      </div>
    </div>
  )
}

export default SocialLink
