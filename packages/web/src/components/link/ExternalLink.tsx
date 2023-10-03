import { MouseEvent, useCallback } from 'react'

import {
  Name,
  isAllowedExternalLink,
  useLeavingAudiusModal
} from '@audius/common'

import { make, useRecord } from 'common/store/analytics/actions'

import { Link, LinkProps } from './Link'

type ExternalLinkProps = LinkProps & {
  source?: 'profile page' | 'track page' | 'collection page'
  showWarning?: boolean
}

export const ExternalLink = (props: ExternalLinkProps) => {
  const { to, onClick, source, showWarning = true, ...other } = props

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
      if (typeof to === 'string' && showWarning && !isAllowedExternalLink(to)) {
        event.preventDefault()
        openLeavingAudiusModal({ link: to as string })
      }
    },
    [onClick, record, source, openLeavingAudiusModal, to, showWarning]
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
