import { useCallback, MouseEvent } from 'react'

import { Name, AllTrackingEvents } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { Tag, TagProps } from '@audius/harmony'
import { Link } from 'react-router-dom'

import { make, useRecord } from 'common/store/analytics/actions'
import { componentWithErrorBoundary } from 'components/error-wrapper/componentWithErrorBoundary'

type TagClickingEvent = Extract<
  AllTrackingEvents,
  { eventName: Name.TAG_CLICKING }
>

type SearchTagProps = Extract<TagProps, { children: string }> & {
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  source: TagClickingEvent['source']
}

const SearchTagContent = (props: SearchTagProps) => {
  const { onClick, source, children, ...other } = props
  const record = useRecord()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      record(make(Name.TAG_CLICKING, { tag: children, source }))
    },
    [onClick, record, children, source]
  )

  const linkTo = route.searchPage({ query: `#${children}` })

  return (
    <Link to={linkTo} onClick={handleClick}>
      <Tag {...other}>{children}</Tag>
    </Link>
  )
}

export const SearchTag = componentWithErrorBoundary(SearchTagContent, {
  name: 'SearchTag'
})
