import type { Nullable } from '@audius/common'
import { useField } from 'formik'
import moment from 'moment'

import { ContextualMenu } from 'app/components/core'

const messages = {
  label: 'Release Date',
  today: 'Today'
}

export const ReleaseDateField = (props) => {
  const [{ value }] = useField<Nullable<string>>('release_date')

  return (
    <ContextualMenu
      menuScreenName='ReleaseDate'
      label={messages.label}
      value={value}
      formattedValue={value ? moment(value).format('M/D/YY @ h:mm A') : null}
      {...props}
    />
  )
}
