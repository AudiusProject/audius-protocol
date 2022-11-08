import { useField } from 'formik'

import type { ContextualSubmenuProps } from 'app/components/core'
import { ContextualSubmenu } from 'app/components/core'
import { makeStyles } from 'app/styles'

import type { FieldProps } from './types'

type ContextualSubmenuFieldProps = FieldProps &
  Omit<ContextualSubmenuProps, 'value' | 'onChange'>

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(2)
  },
  content: {
    marginHorizontal: spacing(2)
  },
  divider: {
    marginHorizontal: spacing(-4)
  }
}))

export const ContextualSubmenuField = (props: ContextualSubmenuFieldProps) => {
  const { name, label: labelProp, ...other } = props
  const { required } = other
  const [{ value, onChange }, { error, touched }] = useField(name)
  const styles = useStyles()

  const label = required ? `${labelProp} *` : labelProp

  return (
    <ContextualSubmenu
      value={value}
      label={label}
      onChange={onChange(name)}
      error={Boolean(error) && touched}
      {...other}
      styles={styles}
    />
  )
}
