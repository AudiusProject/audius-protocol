import { useField } from 'formik'

import type { ContextualSubmenuProps } from 'app/components/core'
import { ContextualSubmenu } from 'app/components/core'

import type { FieldProps } from './types'

type ContextualSubmenuFieldProps = FieldProps &
  Omit<ContextualSubmenuProps, 'value' | 'onChange'>

export const ContextualSubmenuField = (props: ContextualSubmenuFieldProps) => {
  const { name, label: labelProp, ...other } = props
  const { required } = other
  const [{ value }, { error, touched }] = useField(name)

  const label = required ? `${labelProp} *` : labelProp

  return (
    <ContextualSubmenu
      value={value}
      label={label}
      error={Boolean(error) && touched}
      {...other}
    />
  )
}
