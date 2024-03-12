import { MouseEvent, useCallback } from 'react'

import { Name } from '@audius/common/models'
import { useLeavingAudiusModal } from '@audius/common/store'
import { isAllowedExternalLink } from '@audius/common/utils'
import { TextLink, TextLinkProps } from '@audius/harmony'

import { make, useRecord } from 'common/store/analytics/actions'

type ExternalLinkProps = Omit<TextLinkProps, 'href'> & {
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
      if (to && !ignoreWarning && !isAllowedExternalLink(to)) {
        event.preventDefault()
        openLeavingAudiusModal({ link: to })
      }
    },
    [onClick, record, source, openLeavingAudiusModal, to, ignoreWarning]
  )

  return <TextLink isExternal href={to} onClick={handleClick} {...other} />
}
