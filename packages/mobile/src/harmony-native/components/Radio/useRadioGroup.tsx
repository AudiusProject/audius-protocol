import { useCallback, useContext } from 'react'

import { RadioGroupContext } from './RadioGroupContext'

type RadioGroupProps = {
  checked?: boolean
  value?: any
  onValueChange?: (value: string) => void
}

export const useRadioGroup = (props: RadioGroupProps) => {
  const { checked: checkedProp, value, onValueChange } = props
  const radioGroup = useContext(RadioGroupContext)
  let checked = checkedProp
  if (radioGroup) {
    if (typeof checked === 'undefined') {
      checked = String(value) === String(radioGroup.value)
    }
  }

  const handleValueChange = useCallback(() => {
    onValueChange?.(value)
    radioGroup?.onValueChange?.(value)
  }, [onValueChange, value, radioGroup])

  return { checked, onValueChange: handleValueChange }
}
