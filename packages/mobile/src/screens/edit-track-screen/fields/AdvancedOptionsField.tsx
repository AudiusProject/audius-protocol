import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

const messages = {
  advanced: 'Advanced Options'
}

type AdvancedOptionsFieldProps = Partial<ContextualMenuProps>

export const AdvancedOptionsField = (props: AdvancedOptionsFieldProps) => {
  return (
    <ContextualMenu
      renderValue={() => null}
      label={messages.advanced}
      value={null}
      menuScreenName='AdvancedOptions'
      {...props}
    />
  )
}
