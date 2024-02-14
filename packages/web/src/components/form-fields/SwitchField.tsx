import { Switch, SwitchProps } from '@audius/harmony'
import { useField } from 'formik'

type SwitchFieldProps = SwitchProps & {
  name: string
}

export const SwitchField = (props: SwitchFieldProps) => {
  const { name, ...other } = props
  const [field] = useField({ name, type: 'checkbox' })

  return <Switch {...field} {...other} />
}
