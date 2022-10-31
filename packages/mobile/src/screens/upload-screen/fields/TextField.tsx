import { useField } from 'formik'
import { capitalize } from 'lodash'
import { View } from 'react-native'

import type { TextInputProps } from 'app/components/core'
import { TextInput, Text } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { makeStyles } from 'app/styles'

import type { FieldProps } from './types'

type TextFieldProps = FieldProps & TextInputProps

const useStyles = makeStyles(({ spacing, typography }) => ({
  root: {
    marginVertical: spacing(4)
  },
  label: { marginBottom: spacing(2) },
  input: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.demiBold
  }
}))

export const TextField = (props: TextFieldProps) => {
  const {
    name,
    label: labelProp,
    required,
    errorMessage: errorMessageProp,
    ...other
  } = props

  const styles = useStyles()
  const [{ value, onChange, onBlur }, { touched, error }] = useField(name)
  const label = required ? `${labelProp} *` : labelProp
  const errorMessage =
    errorMessageProp ?? error ? `${capitalize(name)} ${error}` : undefined

  return (
    <View style={styles.root}>
      <Text
        fontSize='medium'
        weight='demiBold'
        color='neutralLight4'
        style={styles.label}
      >
        {label}
      </Text>
      <TextInput
        styles={{ input: styles.input }}
        value={value}
        onChangeText={onChange(name)}
        onBlur={onBlur(name)}
        {...other}
      />
      {errorMessage && touched ? (
        <InputErrorMessage message={errorMessage} />
      ) : null}
    </View>
  )
}
