import { useRef, useState } from 'react'

import { Story } from '@storybook/react'
import BN from 'bn.js'

import { TokenAmountInput } from './TokenAmountInput'
import { TokenAmountInputProps } from './types'

export default {
  component: TokenAmountInput,
  title: 'Components/TokenAmountInput'
}

const ControlledTemplate: Story<TokenAmountInputProps> = (args: any) => {
  const [value, setValue] = useState<string>('')
  const [, setValueBN] = useState<BN | undefined>(new BN(0))
  const ref = useRef<HTMLInputElement>(null)
  return (
    <TokenAmountInput
      {...args}
      value={value}
      inputRef={ref}
      onChange={(value, valueBN) => {
        setValue(value)
        setValueBN(valueBN)
      }}
    />
  )
}

const UncontrolledTemplate: Story<TokenAmountInputProps> = (args: any) => (
  <TokenAmountInput {...args} />
)

export const Default = ControlledTemplate.bind({})
Default.args = {
  'aria-label': 'Amount to Send',
  placeholder: 'Enter an amount',
  tokenLabel: '$AUDIO',
  decimals: 8,
  isWhole: true
}

export const Uncontrolled = UncontrolledTemplate.bind({})
Uncontrolled.args = {
  label: 'Amount to Send',
  placeholder: '0',
  tokenLabel: '$AUDIO',
  decimals: 8
}
