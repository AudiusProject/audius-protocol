import { useField } from 'formik'

import type { ContextualSubmenuProps } from 'app/components/core'
import { ContextualSubmenu } from 'app/components/core'

const messages = {
  label: 'Track Visibility',
  public: 'Public',
  hidden: 'Hidden',
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count'
}

const fieldVisibilityLabelMap = {
  genre: messages.showGenre,
  mood: messages.showMood,
  tags: messages.showTags,
  share: messages.showShareButton,
  play_count: messages.showPlayCount
}

const fieldVisibilityKeys = Object.keys(fieldVisibilityLabelMap)

type TrackVisibilityFieldProps = Partial<ContextualSubmenuProps>

export const TrackVisibilityField = (props: TrackVisibilityFieldProps) => {
  const [{ value: isUnlisted }] = useField('is_unlisted')
  const [{ value: fieldVisibility }] = useField('field_visibility')

  const trackVisibilityLabel = isUnlisted ? messages.hidden : messages.public
  const fieldVisibilityLabels = fieldVisibilityKeys
    .filter((visibilityKey) => fieldVisibility[visibilityKey])
    .map((visibilityKey) => fieldVisibilityLabelMap[visibilityKey])

  const values = [trackVisibilityLabel, ...fieldVisibilityLabels]

  return (
    <ContextualSubmenu
      label={messages.label}
      submenuScreenName='TrackVisibility'
      value={values}
      {...props}
    />
  )
}
