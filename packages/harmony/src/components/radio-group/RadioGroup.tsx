import { ChangeEvent, ReactNode, useCallback } from 'react'

import { useControlled } from '../../hooks/useControlled'
import { Flex, FlexProps } from '../layout'

import { RadioGroupContext } from './RadioGroupContext'

export type RadioGroupProps = {
  name: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  children?: ReactNode
  defaultValue?: string
  value?: string | null
} & FlexProps

export const RadioGroup = (props: RadioGroupProps) => {
  const {
    name,
    onChange,
    children,
    value: valueProp,
    defaultValue,
    ...other
  } = props
  const [value, setValueState] = useControlled({
    controlledProp: valueProp,
    defaultValue,
    componentName: 'RadioButtonGroup'
  })
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValueState(e.target.value)
      onChange?.(e)
    },
    [setValueState, onChange]
  )
  return (
    <RadioGroupContext.Provider value={{ name, onChange: handleChange, value }}>
      <Flex role='radiogroup' direction='column' {...other}>
        {children}
      </Flex>
    </RadioGroupContext.Provider>
  )
}
