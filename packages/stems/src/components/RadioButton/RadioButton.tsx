import {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  useCallback,
  useContext
} from 'react'

import cn from 'classnames'

import { RadioGroupContext } from 'components/RadioButtonGroup'

import styles from './RadioButton.module.css'

export type RadioButtonProps = ComponentPropsWithoutRef<'input'> & {
  inputClassName?: string
}

export const RadioButton = (props: RadioButtonProps) => {
  const {
    className,
    inputClassName,
    onChange,
    name: nameProp,
    checked: checkedProp,
    disabled,
    ...other
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
    <div
      className={cn(
        styles.root,
        // Firefox doesn't support :has() so we're using classes here
        { [styles.disabled]: disabled },
        { [styles.checked]: checked },
        className
      )}
    >
      <input
        className={cn(styles.input, inputClassName)}
        name={name}
        checked={checked}
        type='radio'
        onChange={handleChange}
        disabled={disabled}
        {...other}
      />
    </div>
  )
}
