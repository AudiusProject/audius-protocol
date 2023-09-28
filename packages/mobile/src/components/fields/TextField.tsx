import { useField } from 'formik'
import { Platform, View } from 'react-native'

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
    fontFamily: typography.fontByWeight.demiBold,
    lineHeight:
      Platform.OS === 'ios' ? typography.fontSize.xl : typography.fontSize.large
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
    style,
    styles: stylesProp,
    id,
    ...other
  } = props

  const styles = useStyles()
  const [{ value, onChange, onBlur }, { touched, error }] = useField(name)
  const label = required ? `${labelProp} *` : labelProp

  return (
    <View style={[styles.root, style]}>
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
        id={id ?? name}
        {...other}
      />
      {error && touched ? <InputErrorMessage message={error} /> : null}
    </View>
  )
}
