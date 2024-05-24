import { View } from 'react-native'

import { Text } from 'app/components/core'
import { TextField, type TextFieldProps } from 'app/components/fields'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    padding: spacing(4),
    gap: spacing(4),
    borderRadius: spacing(2),
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    backgroundColor: palette.neutralLight10
  },
  textField: {
    marginVertical: 0,
    paddingHorizontal: 0
  },
  textInput: {
    backgroundColor: palette.white
  }
}))

type BoxedTextFieldProps = TextFieldProps & {
  title: string
  description: string
}

export const BoxedTextField = (props: BoxedTextFieldProps) => {
  const { title, description, style, ...other } = props
  const styles = useStyles()

  return (
    <View style={[styles.root, style]}>
      <Text weight='bold'>{title}</Text>
      <Text>{description}</Text>
      <TextField
        style={styles.textField}
        styles={{ root: styles.textInput }}
        {...other}
      />
    </View>
  )
}
