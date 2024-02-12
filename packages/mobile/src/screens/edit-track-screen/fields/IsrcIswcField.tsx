import { removeNullable } from '@audius/common/utils'
import { useField } from 'formik'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

const messages = {
  label: 'ISRC/ISWC'
}

type IsrcFieldProps = Partial<ContextualMenuProps>

export const IsrcField = (props: IsrcFieldProps) => {
  const [{ value: isrc }] = useField<string>('isrc')
  const [{ value: iswc }] = useField<string>('iswc')

  const values = [isrc, iswc].filter(removeNullable)

  return (
    <ContextualMenu
      value={values}
      label={messages.label}
      menuScreenName='IsrcIswc'
      {...props}
    />
  )
}
