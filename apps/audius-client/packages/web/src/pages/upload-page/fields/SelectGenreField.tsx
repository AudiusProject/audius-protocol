import { GENRES } from '@audius/common'

import { DropdownField, DropdownFieldProps } from 'components/form-fields'

const messages = {
  genre: 'Pick a Genre'
}

type SelectGenreFieldProps = Partial<DropdownFieldProps> & {
  name: string
}

const menu = { items: GENRES }

export const SelectGenreField = (props: SelectGenreFieldProps) => {
  return (
    <DropdownField
      aria-label={messages.genre}
      placeholder={messages.genre}
      mount='parent'
      // TODO: Use correct value for Genres based on label (see `convertGenreLabelToValue`)
      menu={menu}
      size='large'
      {...props}
    />
  )
}
