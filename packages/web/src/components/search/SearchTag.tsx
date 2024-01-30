import { useCallback, MouseEvent } from 'react'

import { Name, AllTrackingEvents } from '@audius/common/models'

import {} from '@audius/common'
import { Tag } from '@audius/stems'
import type { TagProps } from '@audius/stems'
import { Link } from 'react-router-dom'

import { make, useRecord } from 'common/store/analytics/actions'
import { searchResultsPage } from 'utils/route'

type TagClickingEvent = Extract<
  AllTrackingEvents,
  { eventName: Name.TAG_CLICKING }
>

type TagPropsBase = Omit<TagProps<Link>, 'to'>

type SearchTagProps = TagPropsBase & {
  source: TagClickingEvent['source']
}

export const SearchTag = (props: SearchTagProps) => {
  const { onClick, source, ...other } = props
  const { tag } = other
  const record = useRecord()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      record(make(Name.TAG_CLICKING, { tag, source }))
    },
    [onClick, record, tag, source]
  )

  return (
    <Tag
      {...props}
      as={Link}
      to={searchResultsPage(`#${tag}`)}
      onClick={handleClick}
    />
  )
}
