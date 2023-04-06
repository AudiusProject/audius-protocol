import { useCallback, MouseEvent } from 'react'

import { AllTrackingEvents, Name } from '@audius/common'
import { Tag } from '@audius/stems'
import type { TagProps } from '@audius/stems'

import { make, useRecord } from 'common/store/analytics/actions'
import { searchResultsPage } from 'utils/route'

type TagClickingEvent = Extract<
  AllTrackingEvents,
  { eventName: Name.TAG_CLICKING }
>

type TagPropsBase = Omit<TagProps, 'to'>

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
    <Tag {...props} to={searchResultsPage(`#${tag}`)} onClick={handleClick} />
  )
}
