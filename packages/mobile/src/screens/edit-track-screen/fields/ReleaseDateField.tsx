import { getLocalTimezone, type Nullable } from '@audius/common'
import { useField } from 'formik'
import moment from 'moment'

import { ContextualMenu } from 'app/components/core'

const messages = {
  label: 'Release Date',
  today: 'Today'
}

export const ReleaseDateField = (props) => {
  const [{ value }] = useField<Nullable<string>>('release_date')
  let formattedValue = ''
  if (value) {
    if (moment(value).isAfter(moment())) {
      formattedValue =
        moment(value).format('M/D/YY @ h:mm A') + ' ' + getLocalTimezone(value)
    } else {
      formattedValue = moment(value).format('M/D/YY')
    }
  }

  return (
    <ContextualMenu
      menuScreenName='ReleaseDate'
      label={messages.label}
      value={value}
      formattedValue={formattedValue}
      {...props}
    />
  )
}
