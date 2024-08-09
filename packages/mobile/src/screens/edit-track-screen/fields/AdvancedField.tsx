import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

const messages = {
  advanced: 'Advanced'
}

type AdvancedFieldProps = Partial<ContextualMenuProps>

export const AdvancedField = (props: AdvancedFieldProps) => {
  return (
    <ContextualMenu
      renderValue={() => null}
      label={messages.advanced}
      value={null}
      menuScreenName='Advanced'
      {...props}
    />
  )
}
