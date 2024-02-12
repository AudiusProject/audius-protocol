import { useState } from 'react'

import { Meta, StoryObj } from '@storybook/react'
import BN from 'bn.js'

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
  const [, setValueBN] = useState<BN | undefined>(new BN(0))
  return (
    <TokenAmountInput
      {...props}
      value={value}
      onChange={(value, valueBN) => {
        setValue(value)
        setValueBN(valueBN)
      }}
    />
  )
}

export const Primary: Story = {
  render: (props) => <ControlledTokenAmountInput {...props} />
}
