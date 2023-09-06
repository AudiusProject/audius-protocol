import { useField } from 'formik'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

import type { FieldProps } from './types'

type ContextualMenuFieldProps = FieldProps &
  Omit<ContextualMenuProps, 'value' | 'onChange'>

export const ContextualMenuField = (props: ContextualMenuFieldProps) => {
  const { name, label: labelProp, ...other } = props
  const { required } = other
  const [{ value }, { error, touched }] = useField(name)

  const label = required ? `${labelProp} *` : labelProp

  return (
    <ContextualMenu
      value={value}
      label={label}
      error={Boolean(error) && touched}
      {...other}
    />
  )
}
