import { useCallback, MouseEvent } from 'react'

import { Name, AllTrackingEvents } from '@audius/common/models'
import { Tag, TagProps } from '@audius/harmony'
import { Link } from 'react-router-dom'

import { make, useRecord } from 'common/store/analytics/actions'
import { searchResultsPage } from 'utils/route'

type TagClickingEvent = Extract<
  AllTrackingEvents,
  { eventName: Name.TAG_CLICKING }
>

type SearchTagProps = Extract<TagProps, { children: string }> & {
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  source: TagClickingEvent['source']
}

export const SearchTag = (props: SearchTagProps) => {
  const { onClick, source, children, ...other } = props
  const record = useRecord()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      record(make(Name.TAG_CLICKING, { tag: children, source }))
    },
    [onClick, record, children, source]
  )

  return (
    <Link to={searchResultsPage(`#${children}`)} onClick={handleClick}>
      <Tag {...other}>{children}</Tag>
    </Link>
  )
}
