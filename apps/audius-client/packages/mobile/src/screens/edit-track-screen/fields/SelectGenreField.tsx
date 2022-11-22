import type { ContextualSubmenuProps } from 'app/components/core'

import { ContextualSubmenuField } from './ContextualSubmenuField'

const messages = {
  genre: 'Genre',
  error: 'Selection Required'
}

type SelectGenreFieldProps = Partial<ContextualSubmenuProps>

export const SelectGenreField = (props: SelectGenreFieldProps) => {
  return (
    <ContextualSubmenuField
      name='genre'
      submenuScreenName='SelectGenre'
      label={messages.genre}
      required
      errorMessage={messages.error}
      {...props}
    />
  )
}
