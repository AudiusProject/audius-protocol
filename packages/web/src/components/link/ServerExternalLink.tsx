import { MouseEvent, ReactNode, useCallback } from 'react'

import { Name } from '@audius/common/models'

import { make, useRecord } from 'common/store/analytics/actions'

const externalLinkAllowList = new Set([
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'blog.audius.co',
  'audius.co',
  'discord.gg',
  'solscan.io'
])

const isAllowedExternalLink = (link: string) => {
  try {
    let hostname = new URL(link).hostname
    hostname = hostname.replace(/^www\./, '')
    return externalLinkAllowList.has(hostname)
  } catch (e) {
    return false
  }
}

export type ServerExternalLinkProps = {
  to: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  source?: 'profile page' | 'track page' | 'collection page'
  ignoreWarning?: boolean
  children: ReactNode
}

export const ServerExternalLink = (props: ServerExternalLinkProps) => {
  const {
    to,
    onClick,
    source,
    ignoreWarning = false,
    children,
    ...other
  } = props

  const record = useRecord()

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      if (source) {
        record(
          make(Name.LINK_CLICKING, {
            // @ts-expect-error
            url: event.target.href,
            source
          })
        )
      }
      if (to && !ignoreWarning && !isAllowedExternalLink(to)) {
        event.preventDefault()
        window.open(to, '_blank', 'noreferrer,noopener')
      }
    },
    [onClick, record, source, to, ignoreWarning]
  )

  return (
    <a
      target='_blank'
      rel='noreferrer'
      href={to}
      onClick={handleClick}
      {...other}
    >
      {children}
    </a>
  )
}
