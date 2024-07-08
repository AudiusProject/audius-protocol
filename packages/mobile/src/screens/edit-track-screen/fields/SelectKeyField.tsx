import type { ContextualMenuProps } from 'app/components/core'

import { ContextualMenuField } from './ContextualMenuField'

const messages = {
  key: 'Key'
}

type SelectKeyFieldProps = Partial<ContextualMenuProps>

export const SelectKeyField = (props: SelectKeyFieldProps) => {
  return (
    <ContextualMenuField
      name='musical_key'
      menuScreenName='SelectKey'
      label={messages.key}
      {...props}
    />
  )
}
