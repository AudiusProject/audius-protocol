import { useField } from 'formik'
import { capitalize } from 'lodash'
import { View } from 'react-native'

import type { TextInputProps } from 'app/components/core'
import { TextInput, InputErrorMessage } from 'app/components/core'
import { makeStyles } from 'app/styles'

import type { FieldProps } from '../../screens/edit-track-screen/fields/types'

export type TextFieldProps = FieldProps & TextInputProps

const useStyles = makeStyles(({ spacing, typography }) => ({
  root: {
    marginVertical: spacing(2),
    paddingHorizontal: spacing(4)
  },
  label: { marginBottom: spacing(2) },
  input: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.demiBold
  },
  labelText: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.demiBold,
    top: 4
  }
}))

export const TextField = (props: TextFieldProps) => {
  const {
    name,
    label: labelProp,
    required,
    errorMessage: errorMessageProp,
    styles: stylesProp,
    ...other
  } = props

  const styles = useStyles()
  const [{ value, onChange, onBlur }, { touched, error }] = useField(name)
  const label = required ? `${labelProp} *` : labelProp
  const errorMessage =
    errorMessageProp || (error ? `${capitalize(name)} ${error}` : undefined)

  return (
    <View style={styles.root}>
      <TextInput
        label={label}
        styles={{
          ...stylesProp,
          input: [styles.input, stylesProp?.input],
          labelText: [styles.labelText, stylesProp?.labelText]
        }}
        value={value}
        onChangeText={onChange(name)}
        onBlur={onBlur(name)}
        returnKeyType='done'
        {...other}
      />
      {error && touched && errorMessage ? (
        <InputErrorMessage message={errorMessage} />
      ) : null}
    </View>
  )
}
