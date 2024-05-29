import { GENRES, convertGenreLabelToValue } from '@audius/common/utils'

import { DropdownField, DropdownFieldProps } from 'components/form-fields'

const messages = {
  genre: 'Pick a Genre'
}

type SelectGenreFieldProps = Partial<DropdownFieldProps> & {
  name: string
}

const menu = {
  items: GENRES.map((genre) => {
    const el = <p>{genre}</p>
    return { el, text: genre, value: convertGenreLabelToValue(genre) }
  })
}

export const SelectGenreField = (props: SelectGenreFieldProps) => {
  return (
    <DropdownField
      aria-label={messages.genre}
      placeholder={messages.genre}
      mount='parent'
      menu={menu}
      size='large'
      isRequired
      {...props}
    />
  )
}
