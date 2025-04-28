import { Nullable } from '@audius/common/utils'
import { spacing } from '@audius/harmony'

import { CollapsibleContent } from 'components/collapsible-content/CollapsibleContent'
import { UserGeneratedText } from 'components/user-generated-text'

const MAX_DESCRIPTION_LINES = 8
const DEFAULT_LINE_HEIGHT = spacing.xl

type TrackDescriptionProps = {
  description: Nullable<string>
  className?: string
}

export const TrackDescription = ({
  description,
  className
}: TrackDescriptionProps) => {
  if (!description) return null

  return (
    <CollapsibleContent
      id='track-description'
      collapsedHeight={DEFAULT_LINE_HEIGHT * MAX_DESCRIPTION_LINES}
    >
      <UserGeneratedText className={className} linkSource='track page'>
        {description}
      </UserGeneratedText>
    </CollapsibleContent>
  )
}
