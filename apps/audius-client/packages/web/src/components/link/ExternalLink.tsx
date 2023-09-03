import { MouseEvent, useCallback } from 'react'

import { Name, useLeavingAudiusModal } from '@audius/common'

import { make, useRecord } from 'common/store/analytics/actions'

import { Link, LinkProps } from './Link'

type ExternalLinkProps = LinkProps & {
  source?: 'profile page' | 'track page' | 'collection page'
}

const allowList = [
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
  'blog.audius.co'
]

export const ExternalLink = (props: ExternalLinkProps) => {
  const { to, onClick, source, ...other } = props

  const record = useRecord()
  const { onOpen: openLeavingAudiusModal } = useLeavingAudiusModal()

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
      if (!allowList.includes(new URL(to as string).hostname)) {
        event.preventDefault()
        openLeavingAudiusModal({ link: to as string })
      }
    },
    [onClick, record, source, openLeavingAudiusModal, to]
  )

  return (
    // @ts-expect-error
    <Link
      as='a'
      href={to as string}
      onClick={handleClick}
      {...other}
      target='_blank'
      rel='noopener noreferrer'
    />
  )
}
