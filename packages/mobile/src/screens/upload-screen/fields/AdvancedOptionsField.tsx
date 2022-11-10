import type { ContextualSubmenuProps } from 'app/components/core'
import { ContextualSubmenu } from 'app/components/core'

const messages = {
  advanced: 'Advanced Options'
}

type AdvancedOptionsFieldProps = Partial<ContextualSubmenuProps>

export const AdvancedOptionsField = (props: AdvancedOptionsFieldProps) => {
  return (
    <ContextualSubmenu
      renderValue={() => null}
      label={messages.advanced}
      value={null}
      submenuScreenName='AdvancedOptions'
      {...props}
    />
  )
}
