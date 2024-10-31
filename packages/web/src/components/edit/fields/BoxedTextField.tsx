import { ReactNode } from 'react'

import { Text } from '@audius/harmony'
import cn from 'classnames'

import { TextField, TextFieldProps } from 'components/form-fields'
import layoutStyles from 'components/layout/layout.module.css'

import styles from './BoxedTextField.module.css'

type BoxedTextFieldProps = {
  title: string
  description: string
  children?: ReactNode
} & TextFieldProps

export const BoxedTextField = (props: BoxedTextFieldProps) => {
  const { title, description, children, ...inputProps } = props
  return (
    <div
      className={cn(styles.inputContainer, layoutStyles.col, layoutStyles.gap4)}
    >
      <div className={cn(layoutStyles.col, layoutStyles.gap2)}>
        <Text variant='title'>{title}</Text>
        <Text variant='body'>{description}</Text>
      </div>
      <TextField inputRootClassName={styles.inputRoot} {...inputProps} />
      {children}
    </div>
  )
}
