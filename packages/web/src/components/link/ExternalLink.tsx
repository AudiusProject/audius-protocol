import { useLeavingAudiusModal } from '@audius/common/store'

import { MouseEvent, useCallback } from 'react'

import { Name } from '@audius/common/models'
import { isAllowedExternalLink } from '@audius/common/utils'

import { make, useRecord } from 'common/store/analytics/actions'

import { Link, LinkProps } from './Link'

type ExternalLinkProps = LinkProps & {
  source?: 'profile page' | 'track page' | 'collection page'
  ignoreWarning?: boolean
}

export const ExternalLink = (props: ExternalLinkProps) => {
  const { to, onClick, source, ignoreWarning = false, ...other } = props

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
      if (
        typeof to === 'string' &&
        !ignoreWarning &&
        !isAllowedExternalLink(to)
      ) {
        event.preventDefault()
        openLeavingAudiusModal({ link: to as string })
      }
    },
    [onClick, record, source, openLeavingAudiusModal, to, ignoreWarning]
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
