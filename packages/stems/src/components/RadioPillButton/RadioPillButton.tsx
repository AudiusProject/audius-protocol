import {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  ReactNode,
  useCallback,
  useContext
} from 'react'

import cn from 'classnames'

import { RadioGroupContext } from '../RadioButtonGroup'

import styles from './RadioPillButton.module.css'

export type RadioPillButtonProps = ComponentPropsWithoutRef<'input'> & {
  inputClassName?: string
  label: ReactNode
}

export const RadioPillButton = (props: RadioPillButtonProps) => {
  const {
    className,
    inputClassName,
    label,
    onChange,
    name: nameProp,
    checked: checkedProp,
    ...inputProps
  } = props

  const radioGroup = useContext(RadioGroupContext)
  let name = nameProp
  let checked = checkedProp
  if (radioGroup) {
    if (typeof name === 'undefined') {
      name = radioGroup.name
    }
    if (typeof checked === 'undefined') {
      checked = String(props.value) === String(radioGroup.value)
    }
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      onChange?.(e)
      radioGroup?.onChange?.(e)
    },
    [onChange, radioGroup]
  )

  return (
    <label className={cn(styles.root, className)}>
      <input
        className={cn(styles.input, inputClassName)}
        name={name}
        checked={checked}
        type='radio'
        onChange={handleChange}
        {...inputProps}
      />
      <span className={styles.labelText}>{label}</span>
    </label>
  )
}
