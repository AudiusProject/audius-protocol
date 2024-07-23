import { advancedAlbumMessages as messages } from '@audius/common/messages'
import { useField } from 'formik'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

type AdvancedAlbumFieldProps = Partial<ContextualMenuProps>

export const AdvancedAlbumField = (props: AdvancedAlbumFieldProps) => {
  const [{ value: upc }] = useField('upc')
  return (
    <ContextualMenu
      label={messages.title}
      value={upc ? `${messages.upcValue} ${upc}` : null}
      menuScreenName='Advanced'
      {...props}
    />
  )
}
