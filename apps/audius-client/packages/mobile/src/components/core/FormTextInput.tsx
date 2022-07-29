import type { ComponentType } from 'react'

import { useField } from 'formik'
import type { TextInputProps, ViewStyle, TextStyle } from 'react-native'
import { View, TextInput, Text, Dimensions } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles'

const validateRequired = (value: string) => {
  if (!value) return 'Required'
  return undefined
}

const useStyles = makeStyles(({ typography, palette, spacing }) => {
  const inputText = { ...typography.body, color: palette.secondary }

  return {
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: palette.neutralLight8,
      width: Dimensions.get('window').width,
      paddingVertical: spacing(2)
    },
    firstInput: {
      borderTopWidth: 1,
      borderTopColor: palette.neutralLight8
    },
    label: {
      minWidth: 100,
      marginLeft: spacing(4),
      ...typography.body,
      color: palette.neutral
    },
    input: {
      ...inputText,
      padding: 0,
      width: '100%',
      flexShrink: 1
    },
    prefix: {
      ...inputText
    }
  }
})

type FormTextInputProps = TextInputProps & {
  icon?: ComponentType<SvgProps>
  isFirstInput?: boolean
  label: string
  name: string
  onChange?: any
  prefix?: string
  required?: boolean
} & StylesProps<{
    root: ViewStyle
    label: TextStyle
  }>

export const FormTextInput = ({
  icon: Icon,
  isFirstInput,
  label,
  name,
  prefix,
  style,
  styles: stylesProp,
  required,
  ...other
}: FormTextInputProps) => {
  const styles = useStyles()
  const [{ value, onChange, onBlur }] = useField<string>({
    name,
    validate: required ? validateRequired : undefined
  })

  return (
    <View
      style={[
        styles.root,
        isFirstInput && styles.firstInput,
        style,
        stylesProp?.root
      ]}
    >
      {Icon ? (
        <View style={styles.label}>
          <Icon
            accessibilityLabel={label}
            fill={styles.label.color}
            height={24}
            width={24}
          />
        </View>
      ) : (
        <Text style={[styles.label, stylesProp?.label]}>{label}</Text>
      )}
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        style={styles.input}
        onBlur={onBlur(name)}
        onChangeText={onChange(name)}
        value={value ?? ''}
        maxLength={200}
        {...other}
      />
    </View>
  )
}
