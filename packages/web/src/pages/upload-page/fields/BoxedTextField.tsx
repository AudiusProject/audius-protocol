import { Text } from '@audius/harmony'
import cn from 'classnames'

import { TextField, TextFieldProps } from 'components/form-fields'
import layoutStyles from 'components/layout/layout.module.css'

import styles from './BoxedTextField.module.css'

type BoxedTextFieldProps = {
  title: string
  description: string
} & TextFieldProps

export const BoxedTextField = (props: BoxedTextFieldProps) => {
  const { title, description, ...inputProps } = props
  return (
    <div
      className={cn(styles.inputContainer, layoutStyles.col, layoutStyles.gap4)}
    >
      <div className={cn(layoutStyles.col, layoutStyles.gap2)}>
        <Text variant='title'>{title}</Text>
        <Text>{description}</Text>
      </div>
      <TextField inputRootClassName={styles.inputRoot} {...inputProps} />
    </div>
  )
}
