import { DropdownField, DropdownFieldProps } from 'components/form-fields'
import { moodMap } from 'utils/Moods'

const MOODS = Object.entries(moodMap).map(([k, el]) => ({
  text: k,
  el
}))

const menu = { items: MOODS }

const messages = {
  mood: 'Pick a Mood'
}

type SelectMoodFieldProps = Partial<DropdownFieldProps> & {
  name: string
}

export const SelectMoodField = (props: SelectMoodFieldProps) => {
  return (
    <DropdownField
      aria-label={messages.mood}
      placeholder={messages.mood}
      mount='parent'
      menu={menu}
      size='large'
      {...props}
    />
  )
}
