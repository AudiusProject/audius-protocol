import type { ReactNode } from 'react'
import { useCallback } from 'react'

import { useControlled } from '../../hooks/useControlled'
import type { FlexProps } from '../layout'
import { Flex } from '../layout'

import { RadioGroupContext } from './RadioGroupContext'

export type RadioGroupProps = {
  onValueChange?: (value: any) => void
  children?: ReactNode
  defaultValue?: string
  value?: string | null
} & FlexProps

export const RadioGroup = (props: RadioGroupProps) => {
  const {
    onValueChange,
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

  const handleValueChange = useCallback(
    (value: string) => {
      setValueState(value)
      onValueChange?.(value)
    },
    [setValueState, onValueChange]
  )

  return (
    <RadioGroupContext.Provider
      value={{ onValueChange: handleValueChange, value }}
    >
      <Flex role='radiogroup' {...other}>
        {children}
      </Flex>
    </RadioGroupContext.Provider>
  )
}
