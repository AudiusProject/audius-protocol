import { ChangeEventHandler, useCallback, useContext } from 'react'

import { RadioGroupContext } from './RadioGroupContext'

type RadioGroupProps = {
  name?: string
  checked?: boolean
  value?: any
  onChange?: ChangeEventHandler<HTMLInputElement>
}

export const useRadioGroup = (props: RadioGroupProps) => {
  const { name: nameProp, checked: checkedProp, value, onChange } = props
  const radioGroup = useContext(RadioGroupContext)
  let name = nameProp
  let checked = checkedProp
  if (radioGroup) {
    if (typeof name === 'undefined') {
      name = radioGroup.name
    }
    if (typeof checked === 'undefined') {
      checked = String(value) === String(radioGroup.value)
    }
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      onChange?.(e)
      radioGroup?.onChange?.(e)
    },
    [onChange, radioGroup]
  )

  return { name, checked, handleChange }
}
