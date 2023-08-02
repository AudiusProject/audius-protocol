import type { ContextualMenuProps } from 'app/components/core'

import { ContextualMenuField } from './ContextualMenuField'

const messages = {
  genre: 'Genre',
  error: 'Selection Required'
}

type SelectGenreFieldProps = Partial<ContextualMenuProps>

export const SelectGenreField = (props: SelectGenreFieldProps) => {
  return (
    <ContextualMenuField
      name='genre'
      menuScreenName='SelectGenre'
      label={messages.genre}
      required
      errorMessage={messages.error}
      {...props}
    />
  )
}
