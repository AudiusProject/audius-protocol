import { MouseEvent, useCallback } from 'react'

import { Name } from '@audius/common'

import { make, useRecord } from 'common/store/analytics/actions'

import { Link, LinkProps } from './Link'

type ExternalLinkProps = LinkProps & {
  source?: 'profile page' | 'track page' | 'collection page'
}

export const ExternalLink = (props: ExternalLinkProps) => {
  const { to, onClick, source, ...other } = props

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
    },
    [onClick, record, source]
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
