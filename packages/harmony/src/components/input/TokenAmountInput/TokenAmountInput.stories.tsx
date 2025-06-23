import { useState } from 'react'

import { Meta, StoryObj } from '@storybook/react'

import { TokenAmountInput } from './TokenAmountInput'
import { TokenAmountInputProps } from './types'

const meta: Meta<typeof TokenAmountInput> = {
  component: TokenAmountInput,
  title: 'Inputs/TokenAmountInput',
  args: {
    label: 'Amount to buy',
    placeholder: 'Enter an amount',
    tokenLabel: '$AUDIO',
    decimals: 8,
    isWhole: true
  }
}

export default meta

type Story = StoryObj<typeof TokenAmountInput>

const ControlledTokenAmountInput = (props: TokenAmountInputProps) => {
  const [value, setValue] = useState<string>('')
  const [, setValueBigInt] = useState<bigint>(BigInt(0))
  return (
    <TokenAmountInput
      {...props}
      value={value}
      onChange={(value, valueBigInt) => {
        setValue(value)
        setValueBigInt(valueBigInt)
      }}
    />
  )
}

export const Primary: Story = {
  render: (props) => <ControlledTokenAmountInput {...props} />
}
