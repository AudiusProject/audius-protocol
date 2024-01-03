import { useCallback, useEffect } from 'react'

import { useDebouncedCallback } from '@audius/common'
import { useField, useFormikContext } from 'formik'
import { Platform, View } from 'react-native'

import type { TextInputProps } from 'app/components/core'
import { TextInput, InputErrorMessage } from 'app/components/core'
import { makeStyles } from 'app/styles'

import type { FieldProps } from '../../screens/edit-track-screen/fields/types'

export type TextFieldProps = FieldProps &
  TextInputProps & {
    noGutter?: boolean
    debouncedValidationMs?: number
  }

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
    noGutter,
    label: labelProp,
    required,
    style,
    styles: stylesProp,
    id,
    onChangeText,
    error: errorProp,
    debouncedValidationMs,
    ...other
  } = props

  const styles = useStyles()
  const [
    { value, onChange, onBlur },
    { touched, error: errorMessage },
    { setTouched }
  ] = useField(name)

  const { validateField, submitCount } = useFormikContext()

  const debouncedValidateField = useDebouncedCallback(
    (field: string) => validateField(field),
    [validateField],
    500
  )

  useEffect(() => {
    if (debouncedValidationMs) {
      debouncedValidateField(name)
    }
  }, [debouncedValidationMs, debouncedValidateField, name, value])
  const label = required ? `${labelProp} *` : labelProp

  const hasError = (errorProp ?? errorMessage) && touched && submitCount > 0

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText?.(text)
      onChange(name)(text)
      if (touched) {
        setTouched(false)
      }
    },
    [onChangeText, onChange, name, touched, setTouched]
  )

  return (
    <View style={[noGutter ? undefined : styles.root, style]}>
      <TextInput
        label={label}
        styles={{
          ...stylesProp,
          input: [styles.input, stylesProp?.input],
          labelText: [styles.labelText, stylesProp?.labelText]
        }}
        value={value}
        onChangeText={handleChangeText}
        onBlur={onBlur(name)}
        returnKeyType='done'
        id={id ?? name}
        error={!!hasError}
        {...other}
      />
      {hasError ? <InputErrorMessage message={errorMessage!} /> : null}
    </View>
  )
}
