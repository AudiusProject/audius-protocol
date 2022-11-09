import type { ContextualSubmenuProps } from 'app/components/core'

import { ContextualSubmenuField } from './ContextualSubmenuField'

const messages = {
  mood: 'Mood'
}

type SelectMoodFieldProps = Partial<ContextualSubmenuProps>

export const SelectMoodField = (props: SelectMoodFieldProps) => {
  return (
    <ContextualSubmenuField
      name='mood'
      submenuScreenName='SelectMood'
      label={messages.mood}
      {...props}
    />
  )
}
