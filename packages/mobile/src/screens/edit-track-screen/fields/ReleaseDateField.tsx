import type { Nullable } from '@audius/common/utils'
import { dayjs } from '@audius/common/utils'
import { useField } from 'formik'

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
      value={value ? dayjs(value).format('M/D/YY') : undefined}
      {...props}
    />
  )
}
