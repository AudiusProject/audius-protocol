import { Ref, forwardRef } from 'react'

import { PasswordInput, PasswordInputProps } from '@audius/harmony'
import { useField } from 'formik'

export type PasswordFieldProps = PasswordInputProps & {
  name: string
}

export const PasswordField = forwardRef(
  (props: PasswordFieldProps, ref: Ref<HTMLInputElement>) => {
    const { name, ...other } = props
    const [field, { touched, error }] = useField(name)

    const hasError = Boolean(touched && error)

    return <PasswordInput ref={ref} {...field} error={hasError} {...other} />
  }
)
