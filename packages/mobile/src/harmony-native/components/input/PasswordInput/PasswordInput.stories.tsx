import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { PasswordInput } from './PasswordInput'
import type { PasswordInputProps } from './types'

const ControlledPasswordInput = (props: PasswordInputProps) => {
  const [value, setValue] = useState(props.value ?? '')
  return (
    <PasswordInput
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.nativeEvent.text)
      }}
    />
  )
}

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/Input/PasswordInput',
  component: PasswordInput,
  render: ControlledPasswordInput
}

export default meta

type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  args: {
    label: 'Password'
  }
}

export const NoVisibilityToggle: Story = {
  args: {
    label: 'Password',
    hideVisibilityToggle: true
  }
}
