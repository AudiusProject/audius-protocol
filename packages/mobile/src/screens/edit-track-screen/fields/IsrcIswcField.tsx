import { removeNullable } from '@audius/common'
import { useField } from 'formik'

import type { ContextualSubmenuProps } from 'app/components/core'
import { ContextualSubmenu } from 'app/components/core'

const messages = {
  label: 'ISRC/ISWC'
}

type IsrcFieldProps = Partial<ContextualSubmenuProps>

export const IsrcField = (props: IsrcFieldProps) => {
  const [{ value: isrc }] = useField<string>('isrc')
  const [{ value: iswc }] = useField<string>('iswc')

  const values = [isrc, iswc].filter(removeNullable)

  return (
    <ContextualSubmenu
      value={values}
      label={messages.label}
      submenuScreenName='IsrcIswc'
      {...props}
    />
  )
}
