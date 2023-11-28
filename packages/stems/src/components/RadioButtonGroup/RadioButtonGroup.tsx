import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  ReactNode,
  useCallback
} from 'react'

import { useControlled } from 'hooks/useControlled'

import { RadioGroupContext } from './RadioGroupContext'

export type RadioButtonGroupProps = {
  name: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  children?: ReactNode
  defaultValue?: string
  value?: string | null
} & ComponentPropsWithoutRef<'div'>

export const RadioButtonGroup = (props: RadioButtonGroupProps) => {
  const {
    name,
    onChange,
    children,
    value: valueProp,
    defaultValue,
    ...divProps
  } = props
  const [value, setValueState] = useControlled({
    controlledProp: valueProp,
    defaultValue,
    componentName: 'RadioButtonGroup'
  })
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      console.log('asdf on change?')
      setValueState(e.target.value)
      onChange?.(e)
    },
    [setValueState, onChange]
  )
  return (
    <RadioGroupContext.Provider value={{ name, onChange: handleChange, value }}>
      <div {...divProps} role='radiogroup'>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}
